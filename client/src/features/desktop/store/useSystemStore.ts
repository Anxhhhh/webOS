import { create } from 'zustand';

export type WallpaperId = 'image' | 'aurora' | 'midnight' | 'sunset';
export type AccentColor = 'blue' | 'emerald' | 'violet' | 'rose';

export interface SystemSettings {
  wallpaper: WallpaperId;
  accentColor: AccentColor;
  reduceTransparency: boolean;
  showSeconds: boolean;
}

interface SystemState {
  isLauncherOpen: boolean;
  toggleLauncher: () => void;
  closeLauncher: () => void;
  settings: SystemSettings;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  // Future window state preparation
  windows: Record<string, unknown>;
}

const defaultSettings: SystemSettings = {
  wallpaper: 'image',
  accentColor: 'blue',
  reduceTransparency: false,
  showSeconds: false,
};

const loadSettings = (): SystemSettings => {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = window.localStorage.getItem('webos:settings');
    if (!stored) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
};

const persistSettings = (settings: SystemSettings) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('webos:settings', JSON.stringify(settings));
};

export const useSystemStore = create<SystemState>((set) => ({
  isLauncherOpen: false,
  toggleLauncher: () => set((state) => ({ isLauncherOpen: !state.isLauncherOpen })),
  closeLauncher: () => set({ isLauncherOpen: false }),
  settings: loadSettings(),
  updateSettings: (partialSettings) => set((state) => {
    const settings = { ...state.settings, ...partialSettings };
    persistSettings(settings);
    return { settings };
  }),
  windows: {},
}));
