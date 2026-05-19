import React from 'react';
import { useWindowStore } from '@/features/window-manager/store/window.store';
import { Window } from './Window';
import { AnimatePresence } from 'framer-motion';

export const WindowContainer: React.FC = () => {
  const windows = useWindowStore((state) => state.windows);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {Object.values(windows).map((win) => (
          <Window key={win.id} windowData={win} />
        ))}
      </AnimatePresence>
    </div>
  );
};
