import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Folder, Globe, Power, Search, Settings, Terminal, User } from 'lucide-react';
import { useSystemStore } from '@/features/desktop/store/useSystemStore';
import { useWindowStore } from '@/features/window-manager/store/window.store';

export const Launcher: React.FC = () => {
  const isLauncherOpen = useSystemStore((state) => state.isLauncherOpen);
  const closeLauncher = useSystemStore((state) => state.closeLauncher);
  const reduceTransparency = useSystemStore((state) => state.settings?.reduceTransparency);
  const openWindow = useWindowStore((state) => state.openWindow);

  const pinnedApps = [
    { id: 'browser', icon: <Globe size={28} className="text-blue-400" />, title: 'Arc Browser' },
    { id: 'explorer', icon: <Folder size={28} className="text-yellow-400" />, title: 'Files', appType: 'folder' },
    { id: 'terminal', icon: <Terminal size={28} className="text-green-400" />, title: 'Terminal', appType: 'terminal' },
    { id: 'settings', icon: <Settings size={28} className="text-gray-300" />, title: 'Settings', appType: 'settings' },
  ];

  const handleAppClick = (id: string, title: string, appType?: string) => {
    openWindow(id, title, appType || id);
    closeLauncher();
  };

  return (
    <AnimatePresence>
      {isLauncherOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className={`absolute bottom-20 left-1/2 z-[90] flex h-[650px] w-[600px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl ${
            reduceTransparency ? 'bg-zinc-950/95' : 'bg-zinc-900/80 backdrop-blur-3xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 pb-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Type here to search"
                className="w-full rounded-full border border-white/10 bg-black/20 py-2.5 pl-12 pr-4 text-sm text-white placeholder-gray-400 transition-colors focus:border-blue-500/50 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 p-8 pt-6">
            <div className="mb-4 flex items-center justify-between px-2">
              <h3 className="text-sm font-semibold text-white">Pinned</h3>
              <button className="rounded px-2 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                All apps {'>'}
              </button>
            </div>
            <div className="grid grid-cols-6 gap-y-6">
              {pinnedApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.id, app.title, app.appType)}
                  className="group flex flex-col items-center gap-2 rounded-xl p-2 transition-colors hover:bg-white/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 shadow-sm transition-colors group-hover:bg-white/10">
                    {app.icon}
                  </div>
                  <span className="w-full truncate text-center text-xs text-white/90 group-hover:text-white">
                    {app.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex h-16 items-center justify-between border-t border-white/10 bg-black/20 px-8">
            <div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500">
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-white/90">User</span>
            </div>
            <button className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
              <Power size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
