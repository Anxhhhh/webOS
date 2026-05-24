import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../store/useMultiplayerStore';

export const JoinScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [name, setName] = useState('');
  const setUsername = useMultiplayerStore((state) => state.setUsername);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setUsername(name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm text-white selection:bg-white/30">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-8 mt-2">
          <h1 className="text-4xl font-bold mb-2 text-white">WebOS</h1>
          <p className="text-zinc-400">Join the collaborative workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
              Your Name
            </label>
            <input
              id="username"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              autoFocus
              maxLength={20}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Enter Workspace
          </button>
        </form>
      </motion.div>
    </div>
  );
};
