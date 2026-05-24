import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

export interface UserInfo {
  id: string;
  name: string;
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
      origin: (origin, callback) => {
        // Dynamically allow any origin (e.g. localhost, Netlify, etc.) to support credentials
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);
    
    // Initialize user
    activeUsers.set(socket.id, {
      id: socket.id,
      name: 'Unknown User',
      x: 0,
      y: 0,
      color: getRandomColor()
    });

    socket.on('join_workspace', (data: { workspaceId: string, name: string } | string) => {
      let workspaceId = '';
      let name = 'Unknown User';
      
      if (typeof data === 'string') {
        workspaceId = data;
      } else {
        workspaceId = data.workspaceId;
        name = data.name || name;
      }

      socket.join(workspaceId);
      console.log(`[Socket] ${socket.id} (${name}) joined workspace ${workspaceId}`);
      
      const user = activeUsers.get(socket.id);
      if (user) {
        user.name = name;
      }
      
      // Broadcast to others in workspace
      socket.to(workspaceId).emit('user_joined', { user });
      
      // Send current state to newly joined user
      socket.emit('workspace_state', { activeUsers: Array.from(activeUsers.values()) });
      
      // Also broadcast an activity event
      socket.to(workspaceId).emit('activity_event', {
        id: Math.random().toString(36).substring(7),
        userId: socket.id,
        userName: user?.name,
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
        userName: activeUsers.get(socket.id)?.name,
        userColor: activeUsers.get(socket.id)?.color || '#fff',
        type: 'app_opened',
        appType,
        title,
        timestamp: Date.now()
      });
    });

    socket.on('fs_changed', (payload) => {
      const workspaceId = payload?.workspaceId || 'global-room';
      console.log(`[Socket] Received fs_changed from ${socket.id} for workspace ${workspaceId}`);
      socket.to(workspaceId).emit('fs_changed');
      console.log(`[Socket] Broadcasted fs_changed to workspace ${workspaceId}`);
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
