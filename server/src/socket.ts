import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

export interface UserInfo {
  id: string;
  x: number;
  y: number;
  color: string;
}

const activeUsers: Map<string, UserInfo> = new Map();
const userColors = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

function getRandomColor() {
  return userColors[Math.floor(Math.random() * userColors.length)];
}

export function initSockets(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Allow all origins for development
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);
    
    // Initialize user
    activeUsers.set(socket.id, {
      id: socket.id,
      x: 0,
      y: 0,
      color: getRandomColor()
    });

    socket.on('join_workspace', (workspaceId: string) => {
      socket.join(workspaceId);
      console.log(`[Socket] ${socket.id} joined workspace ${workspaceId}`);
      
      const user = activeUsers.get(socket.id);
      
      // Broadcast to others in workspace
      socket.to(workspaceId).emit('user_joined', { user });
      
      // Send current state to newly joined user
      socket.emit('workspace_state', { activeUsers: Array.from(activeUsers.values()) });
      
      // Also broadcast an activity event
      socket.to(workspaceId).emit('activity_event', {
        id: Math.random().toString(36).substring(7),
        userId: socket.id,
        userColor: user?.color || '#fff',
        type: 'user_joined',
        timestamp: Date.now()
      });
    });

    socket.on('cursor_move', ({ x, y, workspaceId }) => {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.x = x;
        user.y = y;
        socket.to(workspaceId).emit('cursor_moved', { id: socket.id, x, y });
      }
    });

    socket.on('app_opened', ({ appType, title, workspaceId }) => {
      socket.to(workspaceId).emit('activity_event', {
        id: Math.random().toString(36).substring(7),
        userId: socket.id,
        userColor: activeUsers.get(socket.id)?.color || '#fff',
        type: 'app_opened',
        appType,
        title,
        timestamp: Date.now()
      });
    });

    socket.on('fs_changed', ({ workspaceId }) => {
      socket.to(workspaceId).emit('fs_changed');
    });

    socket.on('file_content_updated', ({ id, content, workspaceId }) => {
      socket.to(workspaceId).emit('file_content_updated', { id, content });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
      activeUsers.delete(socket.id);
      io.emit('user_left', { id: socket.id });
    });
  });
}
