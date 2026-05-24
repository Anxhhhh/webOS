import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Taskbar } from '@/features/desktop/components/taskbar/Taskbar';
import { useSystemStore, type WallpaperId } from '@/features/desktop/store/useSystemStore';
import { WindowContainer } from '@/features/window-manager/components/WindowContainer';
import heroWallpaper from '@/assets/hero.png';
import { DesktopLayer } from './DesktopLayer';
import { ContextMenu } from '@/shared/components/context-menu/ContextMenu';
import { Launcher } from '@/features/desktop/components/launcher/Launcher';
import { MultiplayerCursors } from '@/features/multiplayer/components/MultiplayerCursors';
import { ActivityFeed } from '@/features/multiplayer/components/ActivityFeed';
import { useMultiplayerSocket } from '@/features/multiplayer/hooks/useMultiplayerSocket';
import { useMultiplayerStore } from '@/features/multiplayer/store/useMultiplayerStore';
import { JoinScreen } from '@/features/multiplayer/components/JoinScreen';

const wallpaperStyles: Record<WallpaperId, React.CSSProperties> = {
  image: {
    backgroundImage: `url('/wallpaper.jpg'), url(${heroWallpaper})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  aurora: {
    background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 45%, #c026d3 100%)',
  },
  midnight: {
    background: 'linear-gradient(135deg, #09090b 0%, #334155 50%, #164e63 100%)',
  },
  sunset: {
    background: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 48%, #0ea5e9 100%)',
  },
  custom: {},
};

export const Desktop: React.FC = () => {
  useMultiplayerSocket(); // Initialize socket connection

  const closeLauncher = useSystemStore((state) => state.closeLauncher);
  const toggleLauncher = useSystemStore((state) => state.toggleLauncher);
  const wallpaper = useSystemStore((state) => state.settings.wallpaper);
  const customWallpaperData = useSystemStore((state) => state.settings.customWallpaperData);
  
  const username = useMultiplayerStore((state) => state.username);
  const [showJoinModal, setShowJoinModal] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta') {
        e.preventDefault();
        toggleLauncher();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLauncher]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
      className="relative h-screen w-full overflow-hidden bg-zinc-900 text-white selection:bg-white/30"
      style={
        wallpaper === 'custom' && customWallpaperData
          ? {
              backgroundImage: `url(${customWallpaperData})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : wallpaperStyles[wallpaper] || wallpaperStyles.image
      }
      onClick={closeLauncher}
    >
      <DesktopLayer />

      <MultiplayerCursors />
      <ActivityFeed />

      <WindowContainer />

      <Launcher />

      <Taskbar />

      <ContextMenu />

      {/* Join Workspace Button / Modal */}
      {!username && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowJoinModal(true);
          }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full shadow-lg transition-colors border border-white/10 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Join Workspace
        </button>
      )}
      {showJoinModal && (
        <div onClick={(e) => e.stopPropagation()}>
          <JoinScreen onClose={() => setShowJoinModal(false)} />
        </div>
      )}
    </motion.div>
  );
};
