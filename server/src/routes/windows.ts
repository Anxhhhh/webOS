import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// 1. Get Window Layout
router.get('/layout', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, apptype AS "appType", payload, position, size, maximized, minimized, zindex AS "zIndex"
       FROM window_layout`
    );
    res.json({
      windows: result.rows
    });
  } catch (err) {
    console.error('Error fetching window layout:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Update Window Layout (Overwrite)
router.put('/layout', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { windows } = req.body;

    if (!Array.isArray(windows)) {
      return res.status(400).json({ error: 'Invalid payload: windows must be an array' });
    }

    await client.query('BEGIN');
    
    // Clear existing layout
    await client.query('DELETE FROM window_layout');
    
    // Insert new layout items
    for (const win of windows) {
      if (!win.id || !win.position || !win.size || win.zIndex === undefined) {
        throw new Error('Invalid window object: missing required fields');
      }
      
      await client.query(
        `INSERT INTO window_layout (id, apptype, payload, position, size, maximized, minimized, zindex)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          win.id,
          win.appType || null,
          win.payload ? JSON.stringify(win.payload) : null,
          JSON.stringify(win.position),
          JSON.stringify(win.size),
          !!win.maximized,
          !!win.minimized,
          win.zIndex
        ]
      );
    }
    
    await client.query('COMMIT');
    res.status(200).json({ message: 'Layout updated successfully' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error updating window layout:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  } finally {
    client.release();
  }
});

export default router;
