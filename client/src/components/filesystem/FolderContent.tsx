import React from 'react';
import { useFileSystemStore } from '../../store/filesystem.store';
import { FileGrid } from './FileGrid';

interface FolderContentProps {
  folderId: string;
}

export const FolderContent: React.FC<FolderContentProps> = ({ folderId }) => {
  const openContextMenu = useFileSystemStore((state) => state.openContextMenu);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY, folderId);
  };

  return (
    <div 
      className="w-full h-full min-h-full"
      onContextMenu={handleContextMenu}
    >
      <FileGrid parentId={folderId} />
    </div>
  );
};
