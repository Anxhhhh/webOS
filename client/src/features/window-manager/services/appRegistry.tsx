import React from 'react';

// Using React.lazy for code splitting larger apps.
// For now, FolderWindow is synchronous but can be updated.
import { FolderWindow } from '@/features/filesystem/components/FolderWindow';

// Default fallback app component
const UnknownApp = () => (
  <div className="w-full h-full flex items-center justify-center text-red-400 bg-zinc-900">
    <p>Unknown Application</p>
  </div>
);

export type AppRegistryEntry = {
  id: string;
  component: React.ComponentType<any>;
  title: string;
  defaultSize?: { width: number, height: number };
};

import Notepad from '@/apps/Notepad/Notepad';
import Terminal from '@/apps/Terminal/Terminal';
import Settings from '@/apps/Settings/Settings';

export const AppRegistry: Record<string, AppRegistryEntry> = {
  'folder': {
    id: 'folder',
    component: FolderWindow,
    title: 'File Explorer',
    defaultSize: { width: 640, height: 480 }
  },
  'notepad': {
    id: 'notepad',
    component: Notepad,
    title: 'Notepad',
    defaultSize: { width: 600, height: 450 }
  },
  'terminal': {
    id: 'terminal',
    component: Terminal,
    title: 'Terminal',
    defaultSize: { width: 760, height: 480 }
  },
  'settings': {
    id: 'settings',
    component: Settings,
    title: 'Settings',
    defaultSize: { width: 720, height: 520 }
  }
};

export const getAppComponent = (appType?: string): React.ComponentType<any> => {
  if (!appType) return UnknownApp;
  const entry = AppRegistry[appType];
  return entry ? entry.component : UnknownApp;
};
