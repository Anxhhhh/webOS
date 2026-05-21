import { create } from 'zustand';

export interface RemoteUser {
  id: string;
  x: number;
  y: number;
  color: string;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  userColor: string;
  type: 'user_joined' | 'app_opened';
  appType?: string;
  title?: string;
  timestamp: number;
}

import { Socket } from 'socket.io-client';

interface MultiplayerState {
  connected: boolean;
  socket: Socket | null;
  users: Map<string, RemoteUser>;
  activities: ActivityEvent[];
  workspaceId: string;
  setConnected: (connected: boolean) => void;
  setSocket: (socket: Socket | null) => void;
  setUsers: (users: RemoteUser[]) => void;
  addUser: (user: RemoteUser) => void;
  removeUser: (id: string) => void;
  updateUserCursor: (id: string, x: number, y: number) => void;
  addActivity: (activity: ActivityEvent) => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  connected: false,
  socket: null,
  users: new Map(),
  activities: [],
  workspaceId: 'global-room', // Default workspace

  setConnected: (connected) => set({ connected }),
  setSocket: (socket) => set({ socket }),

  setUsers: (users) => set(() => {
    const newMap = new Map();
    users.forEach(u => newMap.set(u.id, u));
    return { users: newMap };
  }),

  addUser: (user) => set((state) => {
    const newMap = new Map(state.users);
    newMap.set(user.id, user);
    return { users: newMap };
  }),

  removeUser: (id) => set((state) => {
    const newMap = new Map(state.users);
    newMap.delete(id);
    return { users: newMap };
  }),

  updateUserCursor: (id, x, y) => set((state) => {
    const user = state.users.get(id);
    if (!user) return state;
    
    const newMap = new Map(state.users);
    newMap.set(id, { ...user, x, y });
    return { users: newMap };
  }),

  addActivity: (activity) => set((state) => {
    // Keep last 10 activities to avoid memory leak
    const newActivities = [activity, ...state.activities].slice(0, 10);
    return { activities: newActivities };
  })
}));
