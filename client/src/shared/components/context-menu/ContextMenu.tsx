import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, FilePlus, Trash2, Pencil, Copy } from 'lucide-react';
import { useFileSystemStore } from '@/features/filesystem/store/filesystem.store';
import { useShallow } from 'zustand/react/shallow';

export const ContextMenu: React.FC = () => {
  const { items, contextMenu, closeContextMenu, createFolder, createFile, deleteItem, duplicateItem, restoreItem, setEditingId } = useFileSystemStore(
    useShallow((state) => ({
      items: state.items,
      contextMenu: state.contextMenu,
      closeContextMenu: state.closeContextMenu,
      createFolder: state.createFolder,
      createFile: state.createFile,
      deleteItem: state.deleteItem,
      duplicateItem: state.duplicateItem,
      restoreItem: state.restoreItem,
      setEditingId: state.setEditingId,
    }))
  );
  const targetItem = contextMenu.targetId ? items.find(i => i.id === contextMenu.targetId) : null;
  const inRecycleBin = targetItem ? targetItem.parentId === 'recycle-bin' : contextMenu.parentId === 'recycle-bin';
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen) return null;

  const handleCreateItem = (type: 'file' | 'folder') => {
    const defaultName = type === 'folder' ? 'New Folder' : 'New File.txt';
    if (type === 'folder') {
      createFolder(defaultName, contextMenu.parentId);
    } else {
      createFile(defaultName, contextMenu.parentId);
    }
    closeContextMenu();
  };

  const handleDeleteItem = () => {
    if (contextMenu.targetId) {
      deleteItem(contextMenu.targetId);
      closeContextMenu();
    }
  };

  const handleRename = () => {
    if (contextMenu.targetId) {
      setEditingId(contextMenu.targetId);
      closeContextMenu();
    }
  };

  const handleDuplicate = () => {
    if (contextMenu.targetId) {
      duplicateItem(contextMenu.targetId);
      closeContextMenu();
    }
  };

  const handleRestore = () => {
    if (contextMenu.targetId) {
      restoreItem(contextMenu.targetId);
      closeContextMenu();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -5 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          zIndex: 10000,
        }}
        className="min-w-[180px] py-1.5 px-1.5 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col text-sm text-gray-200"
      >
        {!contextMenu.targetId ? (
          <>
            {!inRecycleBin && (
              <>
                <button
                  onClick={() => handleCreateItem('folder')}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 hover:text-white transition-colors w-full text-left"
                >
                  <FolderPlus className="w-4 h-4 text-blue-400" />
                  <span>New Folder</span>
                </button>
                <button
                  onClick={() => handleCreateItem('file')}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 hover:text-white transition-colors w-full text-left"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>New File</span>
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {!targetItem?.isSystem && !inRecycleBin && (
              <>
                <button
                  onClick={handleRename}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 hover:text-white transition-colors w-full text-left"
                >
                  <Pencil className="w-4 h-4 text-green-400" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={handleDuplicate}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 hover:text-white transition-colors w-full text-left"
                >
                  <Copy className="w-4 h-4 text-blue-400" />
                  <span>Duplicate</span>
                </button>
                <div className="h-[1px] bg-white/5 my-1 mx-1" />
              </>
            )}
            
            {inRecycleBin && targetItem && !targetItem.isSystem && (
              <>
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 hover:text-white transition-colors w-full text-left"
                >
                  <Copy className="w-4 h-4 text-green-400" />
                  <span>Restore</span>
                </button>
                <div className="h-[1px] bg-white/5 my-1 mx-1" />
              </>
            )}

            {!targetItem?.isSystem && (
              <button
                onClick={handleDeleteItem}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-500/80 hover:text-white transition-colors w-full text-left text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                <span>{inRecycleBin ? 'Permanently Delete' : 'Delete'}</span>
              </button>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
