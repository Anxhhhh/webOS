import React from 'react';
import { motion } from 'framer-motion';
import { Taskbar } from '@/features/desktop/components/taskbar/Taskbar';
import { useSystemStore, type WallpaperId } from '@/features/desktop/store/useSystemStore';
import { WindowContainer } from '@/features/window-manager/components/WindowContainer';
import heroWallpaper from '@/assets/hero.png';
import { DesktopLayer } from './DesktopLayer';
import { ContextMenu } from '@/shared/components/context-menu/ContextMenu';
import { Launcher } from '@/features/desktop/components/launcher/Launcher';

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
};

export const Desktop: React.FC = () => {
  const closeLauncher = useSystemStore((state) => state.closeLauncher);
  const toggleLauncher = useSystemStore((state) => state.toggleLauncher);
  const wallpaper = useSystemStore((state) => state.settings.wallpaper);

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
      style={wallpaperStyles[wallpaper]}
      onClick={closeLauncher}
    >
      <DesktopLayer />

      <WindowContainer />

      <Launcher />

      <Taskbar />

      <ContextMenu />
    </motion.div>
  );
};
