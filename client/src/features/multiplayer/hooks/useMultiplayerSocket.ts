import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { api } from '@/shared/lib/api';
import { useFileSystemStore } from '@/features/filesystem/store/filesystem.store';

// Get server URL, use hostname so it works across devices on local network
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      return url.origin;
    } catch (e) {
      return apiUrl.replace('/api/v1', '');
    }
  }
  return `http://${window.location.hostname}:5000`;
};

const SERVER_URL = getSocketUrl();

export function useMultiplayerSocket() {
  const socketRef = useRef<Socket | null>(null);
  
    const { 
    workspaceId,
    username,
    setConnected, 
    setSocket,
    setUsers, 
    addUser, 
    removeUser, 
    updateUserCursor, 
    addActivity 
  } = useMultiplayerStore();

  useEffect(() => {
    // Initialize socket connection with websocket transport to avoid Render polling issues
    const socket = io(SERVER_URL, {
      transports: ['websocket']
    });
    socketRef.current = socket;
    setSocket(socket);

    socket.on('connect', () => {
      setConnected(true);
      if (username) {
        socket.emit('join_workspace', { workspaceId, name: username });
      }
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
        const { items, version } = await api.getTree();
        useFileSystemStore.getState().setItemsAndVersion(items, version);
      } catch (err) {
        console.error('Failed to sync fs tree via socket', err);
      }
    });

    socket.on('file_content_updated', async ({ id, content }) => {
      const fsStore = useFileSystemStore.getState();
      const items = fsStore.items.map((item: any) => item.id === id ? { ...item, content } : item);
      fsStore.setItemsAndVersion(items, fsStore.version);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, setConnected, setUsers, addUser, removeUser, updateUserCursor, addActivity]); // removed username from here to prevent reconnecting

  // Watch for username changes and emit join_workspace if connected
  useEffect(() => {
    if (username && socketRef.current?.connected) {
      socketRef.current.emit('join_workspace', { workspaceId, name: username });
    }
  }, [username, workspaceId]);

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
