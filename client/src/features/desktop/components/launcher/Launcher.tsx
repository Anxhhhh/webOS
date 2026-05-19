import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Folder, Terminal, Settings, Power, User } from 'lucide-react';
import { useSystemStore } from '@/features/desktop/store/useSystemStore';
import { useWindowStore } from '@/features/window-manager/store/window.store';

export const Launcher: React.FC = () => {
  const isLauncherOpen = useSystemStore((state) => state.isLauncherOpen);
  const closeLauncher = useSystemStore((state) => state.closeLauncher);
  const openWindow = useWindowStore((state) => state.openWindow);

  const pinnedApps = [
    { id: 'browser', icon: <Globe size={28} className="text-blue-400" />, title: 'Arc Browser' },
    { id: 'explorer', icon: <Folder size={28} className="text-yellow-400" />, title: 'Files' },
    { id: 'terminal', icon: <Terminal size={28} className="text-green-400" />, title: 'Terminal' },
    { id: 'settings', icon: <Settings size={28} className="text-gray-300" />, title: 'Settings' },
  ];

  const handleAppClick = (id: string, title: string) => {
    openWindow(id, title, id);
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
          className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[650px] bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[90]"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {/* Search Bar */}
          <div className="p-6 pb-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Type here to search"
                className="w-full bg-black/20 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Pinned Apps */}
          <div className="flex-1 p-8 pt-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-semibold text-white">Pinned</h3>
              <button className="text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors">
                All apps {'>'}
              </button>
            </div>
            <div className="grid grid-cols-6 gap-y-6">
              {pinnedApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.id, app.title)}
                  className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors shadow-sm">
                    {app.icon}
                  </div>
                  <span className="text-xs text-white/90 truncate w-full text-center group-hover:text-white">
                    {app.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="h-16 bg-black/20 border-t border-white/10 px-8 flex items-center justify-between">
            <div className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-white/90">User</span>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors">
              <Power size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
