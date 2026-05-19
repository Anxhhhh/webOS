export type FileSystemItem = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  originalParentId?: string | null;
  isSystem?: boolean;
  content?: string;
  createdAt: number;
};
