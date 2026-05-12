import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import interact from 'interactjs';
import type { WindowInstance } from '../../types/window.types';
import { useWindowStore } from '../../store/window.store';
import { useFileSystemStore } from '../../store/filesystem.store';
import { WindowHeader } from './WindowHeader';
import { FolderWindow } from '../filesystem/FolderWindow';

interface WindowProps {
  windowData: WindowInstance;
}

export const Window: React.FC<WindowProps> = ({ windowData }) => {
  const { id, title, position, size, minimized, maximized, focused, zIndex, appType, payload } = windowData;
  const { closeWindow, focusWindow, updatePosition, updateSize, minimizeWindow, maximizeWindow, restoreWindow } = useWindowStore();
  const openContextMenu = useFileSystemStore((state) => state.openContextMenu);
  const windowRef = useRef<HTMLDivElement>(null);
  
  const [localPos, setLocalPos] = useState(position);
  const [localSize, setLocalSize] = useState(size);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  
  // Refs to keep track of the most current position/size for interactjs listeners
  // without triggering effect re-runs
  const posRef = useRef(position);
  const sizeRef = useRef(size);

  // Sync local state and refs when store position/size changes (e.g. restore from maximized)
  // but NEVER during an active drag/resize
  useEffect(() => {
    if (!isDraggingRef.current && !isResizingRef.current) {
      setLocalPos(position);
      setLocalSize(size);
      posRef.current = position;
      sizeRef.current = size;
    }
  }, [position, size]);

  useEffect(() => {
    // We completely tear down interact when maximized so it can't be dragged/resized
    if (!windowRef.current || maximized) {
      if (windowRef.current) interact(windowRef.current).unset();
      return;
    }

    const interactable = interact(windowRef.current)
      .draggable({
        allowFrom: '.window-drag-handle',
        inertia: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'parent',
            endOnly: true
          })
        ],
        listeners: {
          start() {
            isDraggingRef.current = true;
            focusWindow(id);
          },
          move(event) {
            const newPos = {
              x: posRef.current.x + event.dx,
              y: posRef.current.y + event.dy
            };
            posRef.current = newPos;
            setLocalPos(newPos);
          },
          end() {
            isDraggingRef.current = false;
            updatePosition(id, posRef.current);
          }
        }
      })
      .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        listeners: {
          start() {
            isResizingRef.current = true;
            focusWindow(id);
          },
          move(event) {
            let { x, y } = posRef.current;

            // Update position if resizing from top or left
            x += event.deltaRect.left;
            y += event.deltaRect.top;

            const newPos = { x, y };
            const newSize = {
              width: event.rect.width,
              height: event.rect.height,
            };

            posRef.current = newPos;
            sizeRef.current = newSize;

            setLocalPos(newPos);
            setLocalSize(newSize);
          },
          end() {
            isResizingRef.current = false;
            updateSize(id, sizeRef.current);
            updatePosition(id, posRef.current);
          }
        },
        modifiers: [
          interact.modifiers.restrictEdges({
            outer: 'parent'
          }),
          interact.modifiers.restrictSize({
            min: { width: 300, height: 200 }
          })
        ],
        inertia: true
      });

    return () => {
      interactable.unset();
    };
  }, [id, focusWindow, updatePosition, updateSize, maximized]);

  const handleMaximizeToggle = () => {
    if (maximized) {
      restoreWindow(id);
    } else {
      maximizeWindow(id);
    }
  };

  const renderContent = () => {
    if (appType === 'folder') {
      return <FolderWindow folderId={payload} />;
    }

    return (
      <div className="flex items-center justify-center h-full opacity-50 text-sm font-medium">
        Window Content for {title}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {!minimized && (
        <motion.div
          ref={windowRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onPointerDown={() => focusWindow(id)}
          style={{
            position: 'absolute',
            zIndex,
            top: localPos.y,
            left: localPos.x,
            width: localSize.width,
            height: localSize.height,
          }}
          className={`
            flex flex-col overflow-hidden
            ${maximized ? 'rounded-none border-none' : 'rounded-2xl border border-white/10 shadow-2xl'}
            ${focused ? 'bg-zinc-900/90 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'bg-zinc-900/70 opacity-95 grayscale-[20%]'}
            backdrop-blur-2xl transition-[box-shadow,background-color,filter,border-radius] duration-200
          `}
        >
          <WindowHeader 
            title={title} 
            focused={focused}
            isMaximized={maximized}
            onClose={() => closeWindow(id)} 
            onMinimize={() => minimizeWindow(id)}
            onMaximize={handleMaximizeToggle}
          />
          
          <div
            className="flex-1 overflow-auto text-white/90 relative"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Only handle if this is a folder window and the event wasn't
              // caught by an inner item (items call stopPropagation themselves).
              if (appType === 'folder' && payload) {
                openContextMenu(e.clientX, e.clientY, payload);
              }
            }}
          >
            {renderContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
