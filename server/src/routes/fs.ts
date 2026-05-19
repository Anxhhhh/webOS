import { Router, Request, Response } from 'express';
import { pool, getCurrentVersion, incrementVersion } from '../db';
import crypto from 'crypto';

const router = Router();

// Helper to generate a unique name if conflict occurs
function getUniqueName(baseName: string, existingNames: string[], isFolder: boolean): string {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  // Check if name has an extension (only for files)
  let nameWithoutExt = baseName;
  let ext = '';
  if (!isFolder) {
    const lastDot = baseName.lastIndexOf('.');
    if (lastDot > 0) {
      nameWithoutExt = baseName.substring(0, lastDot);
      ext = baseName.substring(lastDot);
    }
  }

  // Try suffixing with a number
  let counter = 1;
  let newName = '';
  do {
    counter++;
    newName = `${nameWithoutExt} ${counter}${ext}`;
  } while (existingNames.includes(newName));

  return newName;
}

// 1. Get File Tree
router.get('/tree', async (req: Request, res: Response) => {
  try {
    const itemsResult = await pool.query(
      `SELECT id, name, type, parentid AS "parentId", 
              originalparentid AS "originalParentId", 
              issystem AS "isSystem", content, 
              createdat AS "createdAt" 
       FROM filesystem_items`
    );
    const version = await getCurrentVersion();
    
    res.json({
      items: itemsResult.rows,
      version: String(version)
    });
  } catch (err) {
    console.error('Error fetching file tree:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Create Item
router.post('/items', async (req: Request, res: Response) => {
  try {
    const { id, name, type, parentId, content, originalParentId } = req.body;

    if (!name || (type !== 'file' && type !== 'folder')) {
      return res.status(400).json({ error: 'Invalid name or type' });
    }

    // Check for duplicate name in the same parent directory
    const dupCheck = await pool.query(
      'SELECT id FROM filesystem_items WHERE name = $1 AND (parentid = $2 OR (parentid IS NULL AND $2 IS NULL))',
      [name, parentId]
    );

    if (dupCheck.rowCount !== null && dupCheck.rowCount > 0) {
      return res.status(409).json({ error: 'Conflict: Duplicate name in parent directory' });
    }

    const itemId = id || crypto.randomUUID();
    const createdAt = Date.now();
    const isSystem = false;

    await pool.query(
      `INSERT INTO filesystem_items (id, name, type, parentid, originalparentid, issystem, content, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [itemId, name, type, parentId, originalParentId || null, isSystem, content || '', createdAt]
    );

    const version = await incrementVersion();

    res.status(201).json({
      id: itemId,
      name,
      type,
      parentId,
      originalParentId: originalParentId || null,
      isSystem,
      content: content || '',
      createdAt
    });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Update Item (Rename / Move / Edit Content)
router.patch('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parentId, content, expectedVersion } = req.body;

    // Check concurrency version
    if (expectedVersion) {
      const currentVersion = await getCurrentVersion();
      if (String(currentVersion) !== String(expectedVersion)) {
        return res.status(409).json({ error: 'Conflict: Version mismatch. Please refresh.' });
      }
    }

    // Get current item
    const itemResult = await pool.query(
      'SELECT id, name, parentid AS "parentId", type, content FROM filesystem_items WHERE id = $1',
      [id]
    );

    if (itemResult.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const currentItem = itemResult.rows[0];
    const newName = name !== undefined ? name : currentItem.name;
    const newParentId = parentId !== undefined ? parentId : currentItem.parentId;
    const newContent = content !== undefined ? content : currentItem.content;

    // Validate name if updated
    if (name !== undefined && (!name.trim() || name.includes('/') || name.includes('\\'))) {
      return res.status(400).json({ error: 'Invalid name' });
    }

    // Check for duplicate name if moving or renaming
    if (name !== undefined || parentId !== undefined) {
      const dupCheck = await pool.query(
        'SELECT id FROM filesystem_items WHERE name = $1 AND (parentid = $2 OR (parentid IS NULL AND $2 IS NULL)) AND id != $3',
        [newName, newParentId, id]
      );

      if (dupCheck.rowCount !== null && dupCheck.rowCount > 0) {
        return res.status(409).json({ error: 'Conflict: Duplicate name in parent directory' });
      }
    }

    // If moving, prevent moving folder into itself or its descendants
    if (parentId !== undefined && parentId !== null && currentItem.type === 'folder') {
      let currentParent = parentId;
      while (currentParent) {
        if (currentParent === id) {
          return res.status(400).json({ error: 'Cannot move folder inside itself or its descendants' });
        }
        const parentResult = await pool.query('SELECT parentid FROM filesystem_items WHERE id = $1', [currentParent]);
        if (parentResult.rowCount === 0) break;
        currentParent = parentResult.rows[0].parentid;
      }
    }

    // Update item
    await pool.query(
      'UPDATE filesystem_items SET name = $1, parentid = $2, content = $3 WHERE id = $4',
      [newName, newParentId, newContent, id]
    );

    const version = await incrementVersion();

    // Get final item
    const updatedResult = await pool.query(
      `SELECT id, name, type, parentid AS "parentId", 
              originalparentid AS "originalParentId", 
              issystem AS "isSystem", content, 
              createdat AS "createdAt" 
       FROM filesystem_items WHERE id = $1`,
      [id]
    );

    res.json(updatedResult.rows[0]);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Delete Item
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if exists
    const checkResult = await pool.query('SELECT id FROM filesystem_items WHERE id = $1', [id]);
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Recursive CTE to delete descendants as well
    await pool.query(
      `WITH RECURSIVE descendants AS (
         SELECT id FROM filesystem_items WHERE id = $1
         UNION ALL
         SELECT f.id FROM filesystem_items f
         INNER JOIN descendants d ON f.parentid = d.id
       )
       DELETE FROM filesystem_items WHERE id IN (SELECT id FROM descendants)`
    , [id]);

    await incrementVersion();

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Duplicate Item
router.post('/items/:id/copy', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get all items to compute descendants
    const allResult = await pool.query(
      `SELECT id, name, type, parentid AS "parentId", 
              originalparentid AS "originalParentId", 
              issystem AS "isSystem", content, 
              createdat AS "createdAt" 
       FROM filesystem_items`
    );
    const allItems = allResult.rows;

    const sourceItem = allItems.find(i => i.id === id);
    if (!sourceItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get sibling names for generating a unique duplicate name
    const siblings = allItems.filter(i => i.parentId === sourceItem.parentId).map(i => i.name);
    const copyName = getUniqueName(`${sourceItem.name} (Copy)`, siblings, sourceItem.type === 'folder');

    const newItemsList: any[] = [];
    const idMap = new Map<string, string>();

    // Helper to duplicate recursively
    const duplicateNode = (nodeId: string, newParentId: string | null, customName?: string) => {
      const node = allItems.find(i => i.id === nodeId);
      if (!node) return;

      const newId = crypto.randomUUID();
      idMap.set(nodeId, newId);

      const newNode = {
        id: newId,
        name: customName || node.name,
        type: node.type,
        parentId: newParentId,
        originalParentId: null,
        isSystem: false,
        content: node.content,
        createdAt: Date.now()
      };

      newItemsList.push(newNode);

      // Find children
      const children = allItems.filter(i => i.parentId === nodeId);
      for (const child of children) {
        duplicateNode(child.id, newId);
      }
    };

    // Start duplication
    duplicateNode(id, sourceItem.parentId, copyName);

    // Save to DB
    for (const item of newItemsList) {
      await pool.query(
        `INSERT INTO filesystem_items (id, name, type, parentid, originalparentid, issystem, content, createdat)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item.id, item.name, item.type, item.parentId, item.originalParentId, item.isSystem, item.content, item.createdAt]
      );
    }

    await incrementVersion();

    res.status(201).json(newItemsList);
  } catch (err) {
    console.error('Error duplicating item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
