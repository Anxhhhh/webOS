import type { FileSystemItem } from '@/core/types/filesystem.types';

export type SortField = 'name' | 'date' | 'type';
export type SortOrder = 'asc' | 'desc';

export const sortFilesystemItems = (
  items: FileSystemItem[],
  field: SortField = 'name',
  order: SortOrder = 'asc'
): FileSystemItem[] => {
  return [...items].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        break;
      case 'date':
        comparison = a.createdAt - b.createdAt;
        break;
      case 'type':
        if (a.type === b.type) {
          comparison = a.name.localeCompare(b.name);
        } else {
          comparison = a.type === 'folder' ? -1 : 1; // Folders always first when sorting by type
        }
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};

// Common selector: Folders first, then sorted by name
export const selectFoldersFirst = (items: FileSystemItem[]): FileSystemItem[] => {
  const folders = items.filter(i => i.type === 'folder').sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const files = items.filter(i => i.type === 'file').sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return [...folders, ...files];
};
