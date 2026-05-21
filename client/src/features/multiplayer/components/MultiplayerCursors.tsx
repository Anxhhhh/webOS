import React from 'react';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../store/useMultiplayerStore';

export const MultiplayerCursors: React.FC = () => {
  const users = useMultiplayerStore((state) => state.users);

  return (
    <div className="pointer-events-none absolute inset-0 z-[110] overflow-hidden">
      {Array.from(users.values()).map((user) => (
        <motion.div
          key={user.id}
          className="absolute left-0 top-0 flex flex-col items-start drop-shadow-md"
          initial={{ x: user.x, y: user.y, opacity: 0, scale: 0.8 }}
          animate={{ x: user.x, y: user.y, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 25, mass: 0.5 },
            y: { type: 'spring', stiffness: 300, damping: 25, mass: 0.5 },
            opacity: { duration: 0.2 }
          }}
          style={{ zIndex: 110 }}
        >
          {/* Custom Cursor SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: 'rotate(-15deg)', transformOrigin: 'top left' }}
          >
            <path
              d="M5.65376 2.30061C5.00424 1.70119 4 2.16248 4 3.04825V21.5002C4 22.4042 5.05929 22.8358 5.67493 22.1643L11.5342 15.7681C11.7583 15.5236 12.0722 15.3857 12.404 15.3857H19.7408C20.6128 15.3857 21.0664 14.3411 20.4633 13.7118L5.65376 2.30061Z"
              fill={user.color}
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          {/* Nametag */}
          <div 
            className="mt-1 ml-4 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap shadow-sm"
            style={{ backgroundColor: user.color }}
          >
            {user.id.substring(0, 5)}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
