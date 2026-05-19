import React from 'react';
import { useFileSystemStore } from '@/features/filesystem/store/filesystem.store';
import { DesktopIcons } from './DesktopIcons';

export const DesktopLayer: React.FC = () => {
  const openContextMenu = useFileSystemStore((state) => state.openContextMenu);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, null); // null for desktop parent
  };

  return (
    <div 
      className="absolute inset-0 z-0" 
      onContextMenu={handleContextMenu}
    >
      <DesktopIcons />
    </div>
  );
};
