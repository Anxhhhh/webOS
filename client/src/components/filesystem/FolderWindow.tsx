import React from 'react';
import { FolderContent } from './FolderContent';

interface FolderWindowProps {
  folderId: string;
}

export const FolderWindow: React.FC<FolderWindowProps> = ({ folderId }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto h-full p-4">
        <FolderContent folderId={folderId} />
      </div>
    </div>
  );
};
