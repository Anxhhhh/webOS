import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, Folder, Globe, Settings, Terminal, Wifi, Users } from 'lucide-react';
import { useSystemStore, type AccentColor } from '@/features/desktop/store/useSystemStore';
import { useWindowStore } from '@/features/window-manager/store/window.store';
import { useMultiplayerStore } from '@/features/multiplayer/store/useMultiplayerStore';

const accentClasses: Record<AccentColor, string> = {
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  violet: 'text-violet-400',
  rose: 'text-rose-400',
};

export const Taskbar: React.FC = () => {
  const { isLauncherOpen, toggleLauncher, settings } = useSystemStore();
  const openWindow = useWindowStore((state) => state.openWindow);
  const [time, setTime] = useState(new Date());
  
  const connected = useMultiplayerStore(state => state.connected);
  const users = useMultiplayerStore(state => state.users);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLauncherClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLauncher();
  };

  const pinnedApps = [
    { id: 'browser', icon: <Globe size={20} />, title: 'Arc Browser', appType: 'browser' },
    { id: 'explorer', icon: <Folder size={20} />, title: 'Files', appType: 'folder' },
    { id: 'terminal', icon: <Terminal size={20} />, title: 'Terminal', appType: 'terminal' },
    { id: 'settings', icon: <Settings size={20} />, title: 'Settings', appType: 'settings' },
  ];

  return (
    <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-[100] flex justify-center">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        className={`pointer-events-auto flex items-center gap-2 rounded-3xl border border-white/10 px-3 py-2 shadow-2xl ${
          settings.reduceTransparency ? 'bg-zinc-950/95' : 'bg-white/10 backdrop-blur-xl'
        }`}
      >
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLauncherClick}
          className={`flex items-center justify-center rounded-2xl p-2.5 transition-colors duration-200 ${
            isLauncherOpen ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <svg
            viewBox="0 0 88 88"
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 drop-shadow-md ${accentClasses[settings.accentColor]}`}
            fill="currentColor"
          >
            <path d="M0 0h42v42H0zM46 0h42v42H46zM0 46h42v42H0zM46 46h42v42H46z" />
          </svg>
        </motion.button>

        <div className="mx-1 h-6 w-[1px] rounded-full bg-white/10" />

        <div className="flex items-center gap-1">
          {pinnedApps.map((app) => (
            <motion.button
              key={app.id}
              onClick={() => openWindow(app.id, app.title, app.appType)}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative rounded-2xl p-2.5 text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              {app.icon}
              <div className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/40 opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>

        <div className="mx-1 h-6 w-[1px] rounded-full bg-white/10" />

        <div className="flex items-center gap-3 px-2 text-white/90">
          <div className="flex cursor-pointer items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-white/10" title={`Connected Users: ${users.size + 1}`}>
            <Users size={16} className={connected ? 'text-green-400' : 'text-white/50'} />
            <span className="text-xs font-medium">{users.size + 1}</span>
          </div>
          
          <div className="mx-1 h-4 w-[1px] rounded-full bg-white/20" />
          
          <div className="flex cursor-pointer items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-white/10">
            <Wifi size={16} />
            <Battery size={16} />
          </div>
          <div className="cursor-pointer rounded-xl p-1.5 text-center text-sm font-medium leading-tight transition-colors hover:bg-white/10">
            <div>
              {time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: settings.showSeconds ? '2-digit' : undefined,
              })}
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
