import { create } from 'zustand';

interface SystemState {
  isLauncherOpen: boolean;
  toggleLauncher: () => void;
  closeLauncher: () => void;
  // Future window state preparation
  windows: Record<string, any>;
}

export const useSystemStore = create<SystemState>((set) => ({
  isLauncherOpen: false,
  toggleLauncher: () => set((state) => ({ isLauncherOpen: !state.isLauncherOpen })),
  closeLauncher: () => set({ isLauncherOpen: false }),
  windows: {},
}));
