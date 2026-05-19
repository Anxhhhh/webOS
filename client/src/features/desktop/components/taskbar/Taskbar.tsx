import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Globe, Folder, Terminal, Settings, Battery, Wifi } from 'lucide-react';
import { useSystemStore } from '@/features/desktop/store/useSystemStore';
import { useWindowStore } from '@/features/window-manager/store/window.store';

export const Taskbar: React.FC = () => {
  const { isLauncherOpen, toggleLauncher } = useSystemStore();
  const openWindow = useWindowStore((state) => state.openWindow);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLauncherClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent closing immediately from Desktop onClick
    toggleLauncher();
  };

  const pinnedApps = [
    { id: 'browser', icon: <Globe size={20} />, title: 'Arc Browser' },
    { id: 'explorer', icon: <Folder size={20} />, title: 'Files' },
    { id: 'terminal', icon: <Terminal size={20} />, title: 'Terminal' },
    { id: 'settings', icon: <Settings size={20} />, title: 'Settings' },
  ];

  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-[100]">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        className="flex items-center gap-2 px-3 py-2 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto"
      >
        {/* Launcher Button */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLauncherClick}
          className={`p-2.5 rounded-2xl transition-colors duration-200 flex items-center justify-center
            ${isLauncherOpen ? 'bg-white/20' : 'hover:bg-white/10'}
          `}
        >
          <svg
            viewBox="0 0 88 88"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 drop-shadow-md text-blue-400"
            fill="currentColor"
          >
            <path d="M0 0h42v42H0zM46 0h42v42H46zM0 46h42v42H0zM46 46h42v42H46z" />
          </svg>
        </motion.button>

        <div className="w-[1px] h-6 bg-white/10 mx-1 rounded-full" />

        {/* Pinned Apps Placeholder */}
        <div className="flex items-center gap-1">
          {pinnedApps.map((app) => (
            <motion.button
              key={app.id}
              onClick={() => openWindow(app.id, app.title)}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-2xl hover:bg-white/10 transition-colors duration-200 text-white/90 hover:text-white group relative"
            >
              {app.icon}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-1 rounded-full" />

        {/* System Tray Placeholder */}
        <div className="flex items-center gap-3 px-2 text-white/90">
          <div className="flex items-center gap-2 hover:bg-white/10 p-1.5 rounded-xl transition-colors cursor-pointer">
            <Wifi size={16} />
            <Battery size={16} />
          </div>
          <div className="text-sm font-medium hover:bg-white/10 p-1.5 rounded-xl transition-colors cursor-pointer text-center leading-tight">
            <div>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-[10px] text-white/70">
              {time.toLocaleDateString()}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
