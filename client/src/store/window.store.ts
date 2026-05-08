import { create } from 'zustand';
import type { WindowInstance } from '../types/window.types';

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
            x: window.innerWidth / 2 - 300, 
            y: window.innerHeight / 2 - 200 
          },
          size: { width: 600, height: 400 },
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

      return {
        windows: {
          ...state.windows,
          [id]: { ...windowInstance, position },
        },
      };
    });
  },

  updateSize: (id, size) => {
    set((state) => {
      const windowInstance = state.windows[id];
      if (!windowInstance || windowInstance.maximized) return state;

      return {
        windows: {
          ...state.windows,
          [id]: { ...windowInstance, size },
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
