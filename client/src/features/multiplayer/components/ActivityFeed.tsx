import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore, type ActivityEvent } from '../store/useMultiplayerStore';
import { Terminal, Globe, Folder, Settings, Bell, UserPlus } from 'lucide-react';

const getEventIcon = (event: ActivityEvent) => {
  if (event.type === 'user_joined') return <UserPlus size={16} />;
  
  switch (event.appType) {
    case 'terminal': return <Terminal size={16} />;
    case 'browser': return <Globe size={16} />;
    case 'folder': return <Folder size={16} />;
    case 'settings': return <Settings size={16} />;
    default: return <Bell size={16} />;
  }
};

const getEventText = (event: ActivityEvent) => {
  const shortId = event.userId.substring(0, 5);
  if (event.type === 'user_joined') {
    return `User ${shortId} joined the workspace`;
  }
  return `User ${shortId} opened ${event.title || 'an app'}`;
};

export const ActivityFeed: React.FC = () => {
  const activities = useMultiplayerStore((state) => state.activities);
  const [visibleActivities, setVisibleActivities] = useState<ActivityEvent[]>([]);

  // Auto-dismiss activities after 4 seconds
  useEffect(() => {
    setVisibleActivities(activities);
    
    if (activities.length > 0) {
      const timer = setTimeout(() => {
        setVisibleActivities((prev) => prev.filter(a => a.id !== activities[0].id));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activities]);

  return (
    <div className="absolute top-4 right-4 z-[105] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {visibleActivities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-lg pointer-events-auto"
          >
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm text-white"
              style={{ backgroundColor: activity.userColor }}
            >
              {getEventIcon(activity)}
            </div>
            <span className="text-sm text-white/90 font-medium mr-2">
              {getEventText(activity)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
