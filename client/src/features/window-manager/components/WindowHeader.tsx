import React from 'react';
import { WindowControls } from './WindowControls';

interface WindowHeaderProps {
  title: string;
  focused: boolean;
  isMaximized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

export const WindowHeader: React.FC<WindowHeaderProps> = ({ 
  title, focused, isMaximized, onClose, onMinimize, onMaximize 
}) => {
  return (
    <div 
      className={`
        flex items-center justify-between px-4 py-3 
        border-b border-white/5 
        ${!isMaximized ? 'window-drag-handle cursor-grab active:cursor-grabbing' : ''} 
        rounded-t-2xl transition-colors duration-200
        ${focused ? 'bg-white/[0.08]' : 'bg-white/[0.04]'}
      `}
      onDoubleClick={onMaximize}
    >
      <div className="flex-1 flex items-center">
        <WindowControls 
          onClose={onClose} 
          onMinimize={onMinimize} 
          onMaximize={onMaximize} 
          isMaximized={isMaximized}
        />
      </div>
      
      <div className={`flex-1 flex justify-center text-sm font-medium select-none transition-colors duration-200 ${focused ? 'text-white/90' : 'text-white/50'}`}>
        {title}
      </div>
      
      <div className="flex-1 flex justify-end">
        {/* Placeholder for right side actions */}
      </div>
    </div>
  );
};
