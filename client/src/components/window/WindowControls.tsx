import React from 'react';
import { motion } from 'framer-motion';

interface WindowControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ onClose, onMinimize, onMaximize, isMaximized }) => {
  return (
    <div className="flex items-center gap-2 group ml-1">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/90 flex items-center justify-center border border-[#e0443e] relative"
      >
         <span className="opacity-0 group-hover:opacity-100 text-[8px] text-[#4d0000] absolute font-bold leading-none select-none">×</span>
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); onMinimize(); }}
        className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/90 border border-[#dea123] relative"
      >
        <span className="opacity-0 group-hover:opacity-100 text-[8px] text-[#5a3000] absolute inset-0 flex items-center justify-center font-bold leading-none select-none">−</span>
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); onMaximize(); }}
        className="w-3.5 h-3.5 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/90 border border-[#1aab29] relative"
      >
        <span className="opacity-0 group-hover:opacity-100 text-[8px] text-[#004d09] absolute inset-0 flex items-center justify-center font-bold leading-none select-none">
           {isMaximized ? '↙' : '+'}
         </span>
      </motion.button>
    </div>
  );
};
