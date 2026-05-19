import Dexie, { type Table } from 'dexie';
import type { FileSystemItem } from '@/core/types/filesystem.types';
import type { WindowInstance } from '@/core/types/window.types';

export interface DBState {
  id: string;
  value: any;
}

export class WebOSDatabase extends Dexie {
  items!: Table<FileSystemItem>;
  windows!: Table<WindowInstance>;
  settings!: Table<DBState>;

  constructor() {
    super('WebOSDatabase');
    
    // Initial schema
    this.version(1).stores({
      items: 'id, parentId, type, name',
      windows: 'id, focused, zIndex',
      settings: 'id'
    });

    // Example of future migration (version 2):
    // this.version(2).stores({
    //   items: 'id, parentId, type, name, createdAt', // added new index
    // }).upgrade(trans => {
    //   return trans.table('items').toCollection().modify(item => {
    //     if (!item.createdAt) item.createdAt = Date.now();
    //   });
    // });
  }
}

export const db = new WebOSDatabase();
