import React from 'react';
import { FileGrid } from '../filesystem/FileGrid';

export const DesktopIcons: React.FC = () => {
  return (
    <div className="absolute inset-0 p-4 pointer-events-none">
      <FileGrid parentId={null} />
    </div>
  );
};
