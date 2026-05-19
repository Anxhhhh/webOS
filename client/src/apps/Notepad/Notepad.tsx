import React, { useState, useEffect } from 'react';
import { useFileSystemStore } from '@/features/filesystem/store/filesystem.store';

interface NotepadProps {
  windowId: string;
  payload?: any; // The file ID
}

const Notepad: React.FC<NotepadProps> = ({ payload }) => {
  const fileId = payload as string;
  
  const items = useFileSystemStore((state) => state.items);
  const updateFileContent = useFileSystemStore((state) => state.updateFileContent);
  
  const file = items.find(i => i.id === fileId);
  
  const [content, setContent] = useState(file?.content || '');

  // Keep local state in sync if file changes externally
  useEffect(() => {
    if (file && file.content !== undefined && file.content !== content) {
      setContent(file.content);
    }
  }, [file?.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (fileId) {
      updateFileContent(fileId, newContent);
    }
  };

  if (!file) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-400 bg-zinc-900">
        <p>File not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm relative">
      <div className="flex-none px-4 py-2 border-b border-white/10 bg-white/5 text-xs text-white/50 flex justify-between items-center">
        <span>{file.name}</span>
        <span>{content.length} characters</span>
      </div>
      <textarea
        className="flex-1 w-full h-full bg-transparent resize-none p-4 outline-none focus:ring-0 leading-relaxed custom-scrollbar"
        value={content}
        onChange={handleChange}
        spellCheck={false}
        placeholder="Type here..."
      />
    </div>
  );
};

export default Notepad;
