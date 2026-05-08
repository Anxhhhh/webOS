import { create } from 'zustand';
import type { FileSystemItem } from '../types/filesystem.types';
import { generateId } from '../utils/generateId';

type ContextMenuState = {
  isOpen: boolean;
  x: number;
  y: number;
  targetId: string | null;
  parentId: string | null;
};

interface FileSystemState {
  items: FileSystemItem[];
  contextMenu: ContextMenuState;
  
  editingId: string | null;
  createFolder: (name: string, parentId: string | null) => void;
  createFile: (name: string, parentId: string | null) => void;
  renameItem: (id: string, newName: string) => void;
  deleteItem: (id: string) => void;
  setEditingId: (id: string | null) => void;
  openContextMenu: (x: number, y: number, parentId: string | null, targetId?: string | null) => void;
  closeContextMenu: () => void;
}

const INITIAL_ID_DOCS = 'docs-folder';

export const useFileSystemStore = create<FileSystemState>((set) => ({
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
    }
  ],
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    targetId: null,
    parentId: null,
  },
  editingId: null,

  createFolder: (name, parentId) => set((state) => ({
    items: [
      ...state.items,
      {
        id: generateId(),
        name,
        type: 'folder',
        parentId,
        createdAt: Date.now(),
      }
    ]
  })),

  createFile: (name, parentId) => set((state) => ({
    items: [
      ...state.items,
      {
        id: generateId(),
        name,
        type: 'file',
        parentId,
        createdAt: Date.now(),
      }
    ]
  })),

  renameItem: (id, newName) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, name: newName } : item
    )
  })),

  deleteItem: (id) => set((state) => {
    const getDescendants = (parentId: string): string[] => {
      const children = state.items.filter(item => item.parentId === parentId);
      return children.reduce((acc, child) => [...acc, child.id, ...getDescendants(child.id)], [] as string[]);
    };
    
    const idsToDelete = [id, ...getDescendants(id)];
    
    return {
      items: state.items.filter((item) => !idsToDelete.includes(item.id))
    };
  }),

  setEditingId: (id) => set({ editingId: id }),

  openContextMenu: (x, y, parentId, targetId = null) => set({
    contextMenu: { isOpen: true, x, y, parentId, targetId }
  }),

  closeContextMenu: () => set((state) => ({
    contextMenu: { ...state.contextMenu, isOpen: false }
  })),
}));
