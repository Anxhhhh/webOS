import { create } from 'zustand';
import type { FileSystemItem } from '@/core/types/filesystem.types';
import { generateId } from '@/core/utils/generateId';
import { isValidFileName, getUniqueName } from '../validators/name.validator';
import { api } from '@/shared/lib/api';
import { useMultiplayerStore } from '@/features/multiplayer/store/useMultiplayerStore';

type ContextMenuState = {
  isOpen: boolean;
  x: number;
  y: number;
  targetId: string | null;
  parentId: string | null;
};

interface FileSystemState {
  items: FileSystemItem[];
  version: string | null;
  contextMenu: ContextMenuState;
  
  editingId: string | null;
  setItemsAndVersion: (items: FileSystemItem[], version: string | null) => void;
  createFolder: (name: string, parentId: string | null) => void;
  createFile: (name: string, parentId: string | null) => void;
  renameItem: (id: string, newName: string) => void;
  deleteItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  moveItem: (id: string, newParentId: string | null) => void;
  restoreItem: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  setEditingId: (id: string | null) => void;
  openContextMenu: (x: number, y: number, parentId: string | null, targetId?: string | null) => void;
  closeContextMenu: () => void;
}

export const INITIAL_ID_DOCS = 'docs-folder';
export const INITIAL_ID_RECYCLE_BIN = 'recycle-bin';

// Helper to handle background sync and conflict reconciliation
const triggerSync = async (fn: () => Promise<any>) => {
  try {
    await fn();
    // Fetch fresh tree to get the updated version and ensure local state is perfectly synced
    try {
      const { items, version } = await api.getTree();
      useFileSystemStore.getState().setItemsAndVersion(items, version);
    } catch (syncErr) {
      console.error('Failed to sync tree after operation:', syncErr);
    }

    // Emit fs_changed on success to sync other clients
    const { socket, workspaceId } = useMultiplayerStore.getState();
    if (socket?.connected) {
      socket.emit('fs_changed', { workspaceId });
    }
    
  } catch (err: any) {
    console.error('Sync background error:', err);
    // If it's a conflict or any error, fetch fresh tree and reconcile
    try {
      const { items, version } = await api.getTree();
      useFileSystemStore.getState().setItemsAndVersion(items, version);
    } catch (fetchErr) {
      console.error('Failed to reconcile from server:', fetchErr);
    }
  }
};

// Debounce map for file content syncing to avoid hammering the server
const debouncedContentUpdates = new Map<string, NodeJS.Timeout>();
const syncFileContent = (id: string, content: string, expectedVersion: string | null) => {
  if (debouncedContentUpdates.has(id)) {
    clearTimeout(debouncedContentUpdates.get(id));
  }
  const timeout = setTimeout(() => {
    debouncedContentUpdates.delete(id);
    triggerSync(() => api.updateItem(id, { content, expectedVersion: expectedVersion || undefined }));
  }, 1000);
  debouncedContentUpdates.set(id, timeout);
};

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  items: [
    {
      id: INITIAL_ID_DOCS,
      name: 'Documents',
      type: 'folder',
      parentId: null,
      createdAt: Date.now(),
    },
    {
      id: 'nested-folder',
      name: 'Work Projects',
      type: 'folder',
      parentId: INITIAL_ID_DOCS,
      createdAt: Date.now(),
    },
    {
      id: 'test-file',
      name: 'README.md',
      type: 'file',
      parentId: INITIAL_ID_DOCS,
      createdAt: Date.now(),
      content: '',
    },
    {
      id: INITIAL_ID_RECYCLE_BIN,
      name: 'Recycle Bin',
      type: 'folder',
      parentId: null,
      isSystem: true,
      createdAt: Date.now(),
    }
  ],
  version: null,
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    targetId: null,
    parentId: null,
  },
  editingId: null,

  setItemsAndVersion: (items, version) => set({ items, version }),

  createFolder: (name, parentId) => {
    if (!isValidFileName(name)) return;
    
    const { items } = get();
    const siblings = items.filter(i => i.parentId === parentId).map(i => i.name);
    const uniqueName = getUniqueName(name, siblings, true);
    const id = generateId();
    const newItem: FileSystemItem = {
      id,
      name: uniqueName,
      type: 'folder',
      parentId,
      createdAt: Date.now(),
    };

    set({
      items: [...items, newItem]
    });

    // Sync in background
    triggerSync(() => api.createItem({
      id,
      name: uniqueName,
      type: 'folder',
      parentId
    }));
  },

  createFile: (name, parentId) => {
    if (!isValidFileName(name)) return;

    const { items } = get();
    const siblings = items.filter(i => i.parentId === parentId).map(i => i.name);
    const uniqueName = getUniqueName(name, siblings, false);
    const id = generateId();
    const newItem: FileSystemItem = {
      id,
      name: uniqueName,
      type: 'file',
      parentId,
      content: "",
      createdAt: Date.now(),
    };

    set({
      items: [...items, newItem]
    });

    // Sync in background
    triggerSync(() => api.createItem({
      id,
      name: uniqueName,
      type: 'file',
      parentId,
      content: ""
    }));
  },

  renameItem: (id, newName) => {
    if (!isValidFileName(newName)) return;

    const { items, version } = get();
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    const siblings = items
      .filter(i => i.parentId === targetItem.parentId && i.id !== id)
      .map(i => i.name);
      
    const uniqueName = getUniqueName(newName, siblings, targetItem.type === 'folder');

    set({
      items: items.map((item) => 
        item.id === id ? { ...item, name: uniqueName } : item
      )
    });

    // Sync in background
    triggerSync(() => api.updateItem(id, {
      name: uniqueName,
      expectedVersion: version || undefined
    }));
  },

  deleteItem: (id) => {
    const { items, version } = get();
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    if (targetItem.parentId !== INITIAL_ID_RECYCLE_BIN && targetItem.id !== INITIAL_ID_RECYCLE_BIN) {
      // Generate unique name for recycle bin to prevent conflicts
      const siblingsInRecycleBin = items
        .filter(i => i.parentId === INITIAL_ID_RECYCLE_BIN)
        .map(i => i.name);
      const uniqueName = getUniqueName(targetItem.name, siblingsInRecycleBin, targetItem.type === 'folder');

      // Move to recycle bin instead of deleting
      set({
        items: items.map(item => 
          item.id === id ? { ...item, parentId: INITIAL_ID_RECYCLE_BIN, name: uniqueName, originalParentId: item.parentId } : item
        )
      });

      // Sync in background (this is moving to recycle bin)
      triggerSync(() => api.updateItem(id, {
        parentId: INITIAL_ID_RECYCLE_BIN,
        name: uniqueName,
        expectedVersion: version || undefined
      }));
      return;
    }

    // Permanently delete (already in recycle bin)
    const getDescendants = (parentId: string): string[] => {
      const children = items.filter(item => item.parentId === parentId);
      return children.reduce((acc, child) => [...acc, child.id, ...getDescendants(child.id)], [] as string[]);
    };
    
    const idsToDelete = [id, ...getDescendants(id)];
    
    set({
      items: items.filter((item) => !idsToDelete.includes(item.id))
    });

    // Sync in background (permanently delete)
    triggerSync(() => api.deleteItem(id));
  },

  duplicateItem: (id) => {
    const { items } = get();
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    // Deep copy of descendants locally for optimistic UI
    const tempIdsMap = new Map<string, string>();
    const createCopies = (sourceId: string, destParentId: string | null): FileSystemItem[] => {
      const source = items.find(i => i.id === sourceId);
      if (!source) return [];

      const siblings = items.filter(i => i.parentId === destParentId).map(i => i.name);
      const newName = sourceId === id 
        ? getUniqueName(source.name + ' (Copy)', siblings, source.type === 'folder')
        : source.name;

      const newId = generateId();
      tempIdsMap.set(sourceId, newId);
      
      const newItem = {
        ...source,
        id: newId,
        parentId: destParentId,
        name: newName,
        createdAt: Date.now()
      };

      const children = items.filter(i => i.parentId === sourceId);
      const childCopies = children.flatMap(child => createCopies(child.id, newId));

      return [newItem, ...childCopies];
    };

    const copiedItems = createCopies(id, targetItem.parentId);
    set({
      items: [...items, ...copiedItems]
    });

    // Sync in background and replace with actual server copies to get correct IDs
    triggerSync(async () => {
      const serverCopies = await api.copyItem(id);
      
      // Update state with server copies instead of temporary ones
      const currentItems = get().items.filter(item => !copiedItems.some(ci => ci.id === item.id));
      set({
        items: [...currentItems, ...serverCopies]
      });
    });
  },

  moveItem: (id, newParentId) => {
    const { items, version } = get();
    const targetItem = items.find(i => i.id === id);
    if (!targetItem || targetItem.parentId === newParentId) return;

    // Prevent moving a folder into itself or its descendants
    if (targetItem.type === 'folder') {
      let currentParent = newParentId;
      while (currentParent) {
        if (currentParent === id) return;
        const parentNode = items.find(i => i.id === currentParent);
        currentParent = parentNode ? parentNode.parentId : null;
      }
    }

    const siblings = items
      .filter(i => i.parentId === newParentId)
      .map(i => i.name);
      
    const uniqueName = getUniqueName(targetItem.name, siblings, targetItem.type === 'folder');

    set({
      items: items.map((item) => 
        item.id === id ? { ...item, parentId: newParentId, name: uniqueName } : item
      )
    });

    // Sync in background
    triggerSync(() => api.updateItem(id, {
      parentId: newParentId,
      name: uniqueName,
      expectedVersion: version || undefined
    }));
  },

  updateFileContent: (id, content) => {
    const { items, version } = get();
    const targetItem = items.find(i => i.id === id);
    if (!targetItem || targetItem.type !== 'file') return;

    set({
      items: items.map(item => 
        item.id === id ? { ...item, content } : item
      )
    });

    // Real-time broadcast
    const { socket, workspaceId } = useMultiplayerStore.getState();
    if (socket?.connected) {
      socket.emit('file_content_updated', { id, content, workspaceId });
    }

    // Debounced sync in background
    syncFileContent(id, content, version);
  },

  restoreItem: (id) => {
    const { items, version } = get();
    const targetItem = items.find(i => i.id === id);
    if (!targetItem || targetItem.parentId !== INITIAL_ID_RECYCLE_BIN) return;

    const originalParentExists = targetItem.originalParentId 
      ? items.some(i => i.id === targetItem.originalParentId)
      : false;

    const newParentId = originalParentExists ? targetItem.originalParentId! : null;

    const siblings = items
      .filter(i => i.parentId === newParentId)
      .map(i => i.name);
      
    const uniqueName = getUniqueName(targetItem.name, siblings, targetItem.type === 'folder');

    set({
      items: items.map(item => 
        item.id === id ? { ...item, parentId: newParentId, name: uniqueName, originalParentId: null } : item
      )
    });

    // Sync in background
    triggerSync(() => api.updateItem(id, {
      parentId: newParentId,
      name: uniqueName,
      expectedVersion: version || undefined
    }));
  },

  setEditingId: (id) => set({ editingId: id }),

  openContextMenu: (x, y, parentId, targetId = null) => set({
    contextMenu: { isOpen: true, x, y, parentId, targetId }
  }),

  closeContextMenu: () => set((state) => ({
    contextMenu: { ...state.contextMenu, isOpen: false }
  })),
}));
