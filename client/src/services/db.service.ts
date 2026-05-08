import Dexie, { type Table } from 'dexie';
import type { FileSystemItem } from '../types/filesystem.types';
import type { WindowInstance } from '../types/window.types';

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
    this.version(1).stores({
      items: 'id, parentId, type, name',
      windows: 'id, focused, zIndex',
      settings: 'id'
    });
  }
}

export const db = new WebOSDatabase();
