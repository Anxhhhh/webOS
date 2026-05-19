import React from 'react';
import { useFileSystemStore } from '@/features/filesystem/store/filesystem.store';
import { useShallow } from 'zustand/react/shallow';
import { FileItem } from './FileItem';
import { FolderItem } from './FolderItem';
import { selectFoldersFirst } from '../selectors/sort.selectors';

interface FileGridProps {
  parentId: string | null;
}

export const FileGrid: React.FC<FileGridProps> = ({ parentId }) => {
  const items = useFileSystemStore(
    useShallow((state) => selectFoldersFirst(state.items.filter((item) => item.parentId === parentId)))
  );

  return (
    <div className="flex flex-wrap gap-2 content-start w-full h-full pointer-events-auto">
      {items.map((item) => (
        item.type === 'folder' ? (
          <FolderItem key={item.id} item={item} />
        ) : (
          <FileItem key={item.id} item={item} />
        )
      ))}
    </div>
  );
};
