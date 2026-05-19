import React from 'react';
import { motion } from 'framer-motion';
import { File } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useFileSystemStore } from '@/features/filesystem/store/filesystem.store';
import { useWindowStore } from '@/features/window-manager/store/window.store';
import { EditableName } from './EditableName';
import type { FileSystemItem } from '@/core/types/filesystem.types';

interface FileItemProps {
  item: FileSystemItem;
}

export const FileItem: React.FC<FileItemProps> = ({ item }) => {
  const { openContextMenu, renameItem, editingId, setEditingId } = useFileSystemStore(
    useShallow((state) => ({
      openContextMenu: state.openContextMenu,
      renameItem: state.renameItem,
      editingId: state.editingId,
      setEditingId: state.setEditingId,
    }))
  );

  const openWindow = useWindowStore((state) => state.openWindow);

  const isEditing = editingId === item.id;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY, item.parentId, item.id);
  };

  const handleRenameConfirm = (newName: string) => {
    if (newName.trim() && newName !== item.name) {
      renameItem(item.id, newName.trim());
    }
    setEditingId(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    openWindow(`notepad-${item.id}`, item.name, 'notepad', item.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={!isEditing ? { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' } : {}}
      whileTap={!isEditing ? { scale: 0.95 } : {}}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      className="flex flex-col items-center justify-start p-2 rounded-lg cursor-pointer w-20 h-24 gap-1 text-white hover:backdrop-blur-sm transition-colors"
    >
      <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl shadow-sm border border-white/20">
        <File className="w-6 h-6 text-gray-200" />
      </div>
      <EditableName
        initialName={item.name}
        isEditing={isEditing}
        onConfirm={handleRenameConfirm}
        onCancel={() => setEditingId(null)}
        className="text-xs font-medium drop-shadow-md"
      />
    </motion.div>
  );
};
