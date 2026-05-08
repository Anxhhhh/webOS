import React from 'react';
import { motion } from 'framer-motion';
import { Taskbar } from '../taskbar/Taskbar';
import { useSystemStore } from '../../store/useSystemStore';
import { WindowContainer } from '../window/WindowContainer';
import heroWallpaper from '../../assets/hero.png'; // Fallback if no other wallpaper is found
import { DesktopLayer } from './DesktopLayer';
import { ContextMenu } from '../context-menu/ContextMenu';

export const Desktop: React.FC = () => {
  const closeLauncher = useSystemStore((state) => state.closeLauncher);

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

      <Taskbar />

      {/* Rendered at root level, outside all stacking contexts, so it always appears above windows */}
      <ContextMenu />
    </motion.div>
  );
};
