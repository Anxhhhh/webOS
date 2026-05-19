import React from 'react';
import { motion } from 'framer-motion';
import { Taskbar } from '@/features/desktop/components/taskbar/Taskbar';
import { useSystemStore } from '@/features/desktop/store/useSystemStore';
import { WindowContainer } from '@/features/window-manager/components/WindowContainer';
import heroWallpaper from '@/assets/hero.png'; // Fallback if no other wallpaper is found
import { DesktopLayer } from './DesktopLayer';
import { ContextMenu } from '@/shared/components/context-menu/ContextMenu';
import { Launcher } from '@/features/desktop/components/launcher/Launcher';

export const Desktop: React.FC = () => {
  const closeLauncher = useSystemStore((state: any) => state.closeLauncher);
  const toggleLauncher = useSystemStore((state: any) => state.toggleLauncher);

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
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="relative w-full h-screen overflow-hidden bg-zinc-900 text-white selection:bg-white/30"
      style={{
        backgroundImage: `url('/wallpaper.jpg'), url(${heroWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={closeLauncher}
    >
      <DesktopLayer />

      <WindowContainer />

      <Launcher />

      <Taskbar />

      {/* Rendered at root level, outside all stacking contexts, so it always appears above windows */}
      <ContextMenu />
    </motion.div>
  );
};
