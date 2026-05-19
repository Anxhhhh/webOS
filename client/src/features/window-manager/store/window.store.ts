import { create } from 'zustand';
import type { WindowInstance } from '@/core/types/window.types';
import { AppRegistry } from '../services/appRegistry';

interface WindowState {
  windows: Record<string, WindowInstance>;
  topZIndex: number;
  openWindow: (id: string, title: string, appType?: string, payload?: any) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updatePosition: (id: string, position: { x: number; y: number }) => void;
  updateSize: (id: string, size: { width: number; height: number }) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
}

export const useWindowStore = create<WindowState>((set, get) => ({
  windows: {},
  topZIndex: 10,

  openWindow: (id, title, appType, payload) => {
    const { windows, topZIndex } = get();
    if (windows[id]) {
      // If minimized, restore it
      if (windows[id].minimized) {
        get().restoreWindow(id);
      }
      get().focusWindow(id);
      return;
    }

    const defaultSize = (appType && AppRegistry[appType]?.defaultSize) 
      ? AppRegistry[appType].defaultSize! 
      : { width: 600, height: 400 };

    const newZIndex = topZIndex + 1;
    set({
      windows: {
        ...windows,
        [id]: {
          id,
          title,
          appType,
          payload,
          position: { 
            x: Math.max(0, window.innerWidth / 2 - defaultSize.width / 2), 
            y: Math.max(0, window.innerHeight / 2 - defaultSize.height / 2) 
          },
          size: defaultSize,
          minimized: false,
          maximized: false,
          focused: true,
          zIndex: newZIndex,
        },
      },
      topZIndex: newZIndex,
    });

    set((state) => {
      const updatedWindows = { ...state.windows };
      Object.keys(updatedWindows).forEach((key) => {
        if (key !== id) updatedWindows[key].focused = false;
      });
      return { windows: updatedWindows };
    });
  },

  closeWindow: (id) => {
    set((state) => {
      const newWindows = { ...state.windows };
      delete newWindows[id];
      return { windows: newWindows };
    });
  },

  focusWindow: (id) => {
    set((state) => {
      const windowInstance = state.windows[id];
      if (!windowInstance || (windowInstance.focused && !windowInstance.minimized)) return state;

      const newZIndex = state.topZIndex + 1;
      const updatedWindows = { ...state.windows };

      Object.keys(updatedWindows).forEach((key) => {
        updatedWindows[key].focused = key === id;
      });

      updatedWindows[id].zIndex = newZIndex;
      if (updatedWindows[id].minimized) {
        updatedWindows[id].minimized = false;
      }

      return {
        windows: updatedWindows,
        topZIndex: newZIndex,
      };
    });
  },

  updatePosition: (id, position) => {
    set((state) => {
      const windowInstance = state.windows[id];
      if (!windowInstance || windowInstance.maximized) return state;

      // Keep at least 100px visible horizontally, and keep header visible vertically
      const clampedX = Math.max(-windowInstance.size.width + 100, Math.min(position.x, window.innerWidth - 100));
      const clampedY = Math.max(0, Math.min(position.y, window.innerHeight - 50));

      return {
        windows: {
          ...state.windows,
          [id]: { ...windowInstance, position: { x: clampedX, y: clampedY } },
        },
      };
    });
  },

  updateSize: (id, size) => {
    set((state) => {
      const windowInstance = state.windows[id];
      if (!windowInstance || windowInstance.maximized) return state;

      // Don't allow resizing beyond viewport
      const clampedWidth = Math.min(Math.max(300, size.width), window.innerWidth);
      const clampedHeight = Math.min(Math.max(200, size.height), window.innerHeight - 70);

      return {
        windows: {
          ...state.windows,
          [id]: { ...windowInstance, size: { width: clampedWidth, height: clampedHeight } },
        },
      };
    });
  },

  minimizeWindow: (id) => {
    set((state) => {
      const windowInstance = state.windows[id];
      if (!windowInstance) return state;

      return {
        windows: {
          ...state.windows,
          [id]: { ...windowInstance, minimized: true, focused: false },
        },
      };
    });
  },

  maximizeWindow: (id) => {
    set((state) => {
      const windowInstance = state.windows[id];
      if (!windowInstance || windowInstance.maximized) return state;

      return {
        windows: {
          ...state.windows,
          [id]: { 
            ...windowInstance, 
            maximized: true,
            previousState: {
              position: windowInstance.position,
              size: windowInstance.size
            },
            position: { x: 0, y: 0 },
            size: { width: window.innerWidth, height: window.innerHeight - 70 } // Leave space for taskbar
          },
        },
      };
    });
  },

  restoreWindow: (id) => {
    set((state) => {
      const windowInstance = state.windows[id];
      if (!windowInstance) return state;

      if (windowInstance.minimized) {
        return {
          windows: {
            ...state.windows,
            [id]: { ...windowInstance, minimized: false, focused: true },
          },
        };
      }

      if (windowInstance.maximized && windowInstance.previousState) {
        return {
          windows: {
            ...state.windows,
            [id]: { 
              ...windowInstance, 
              maximized: false,
              position: windowInstance.previousState.position,
              size: windowInstance.previousState.size
            },
          },
        };
      }

      return state;
    });
  }
}));
