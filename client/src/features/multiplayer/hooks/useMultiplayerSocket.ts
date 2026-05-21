import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMultiplayerStore } from '../store/useMultiplayerStore';

// Get server URL, use hostname so it works across devices on local network
const SERVER_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

export function useMultiplayerSocket() {
  const socketRef = useRef<Socket | null>(null);
  
  const { 
    workspaceId, 
    setConnected, 
    setSocket,
    setUsers, 
    addUser, 
    removeUser, 
    updateUserCursor, 
    addActivity 
  } = useMultiplayerStore();

  useEffect(() => {
    // Initialize socket connection
    const socket = io(SERVER_URL);
    socketRef.current = socket;
    setSocket(socket);

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_workspace', workspaceId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('workspace_state', ({ activeUsers }) => {
      // Filter out self
      const others = activeUsers.filter((u: any) => u.id !== socket.id);
      setUsers(others);
    });

    socket.on('user_joined', ({ user }) => {
      if (user.id !== socket.id) {
        addUser(user);
      }
    });

    socket.on('user_left', ({ id }) => {
      removeUser(id);
    });

    socket.on('cursor_moved', ({ id, x, y }) => {
      updateUserCursor(id, x, y);
    });

    socket.on('activity_event', (event) => {
      addActivity(event);
    });

    socket.on('fs_changed', async () => {
      try {
        const { api } = await import('@/shared/lib/api');
        const { useFileSystemStore } = await import('@/features/filesystem/store/filesystem.store');
        const { items, version } = await api.getTree();
        useFileSystemStore.getState().setItemsAndVersion(items, version);
      } catch (err) {
        console.error('Failed to sync fs tree via socket', err);
      }
    });

    socket.on('file_content_updated', async ({ id, content }) => {
      const { useFileSystemStore } = await import('@/features/filesystem/store/filesystem.store');
      const fsStore = useFileSystemStore.getState();
      const items = fsStore.items.map(item => item.id === id ? { ...item, content } : item);
      fsStore.setItemsAndVersion(items, fsStore.version);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, setConnected, setUsers, addUser, removeUser, updateUserCursor, addActivity]);

  // Global mouse tracker to emit cursor events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!socketRef.current?.connected) return;
      
      // Throttle mouse emissions roughly to ~20-30fps
      if (!handleMouseMove.lastEmit || Date.now() - handleMouseMove.lastEmit > 40) {
        socketRef.current.emit('cursor_move', {
          x: e.clientX,
          y: e.clientY,
          workspaceId
        });
        handleMouseMove.lastEmit = Date.now();
      }
    };
    handleMouseMove.lastEmit = 0;

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [workspaceId]);

  return socketRef;
}
