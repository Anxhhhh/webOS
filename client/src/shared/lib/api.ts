const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface FileSystemItemPayload {
  id?: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  originalParentId?: string | null;
}

export interface WindowLayoutPayload {
  id: string;
  appType?: string;
  payload?: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  maximized: boolean;
  minimized: boolean;
  zIndex: number;
}

export const api = {
  // Filesystem
  async getTree(): Promise<{ items: any[]; version: string }> {
    const res = await fetch(`${API_BASE}/fs/tree`);
    if (!res.ok) throw new Error('Failed to fetch file tree');
    return res.json();
  },

  async createItem(payload: FileSystemItemPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/fs/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 409) throw new Error('409_CONFLICT');
    if (!res.ok) throw new Error('Failed to create item');
    return res.json();
  },

  async updateItem(id: string, payload: { name?: string; parentId?: string | null; expectedVersion?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/fs/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 409) throw new Error('409_CONFLICT');
    if (!res.ok) throw new Error('Failed to update item');
    return res.json();
  },

  async deleteItem(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/fs/items/${id}`, {
      method: 'DELETE',
    });
    if (res.status === 409) throw new Error('409_CONFLICT');
    if (!res.ok) throw new Error('Failed to delete item');
  },

  async copyItem(id: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/fs/items/${id}/copy`, {
      method: 'POST',
    });
    if (res.status === 409) throw new Error('409_CONFLICT');
    if (!res.ok) throw new Error('Failed to copy item');
    return res.json();
  },

  // Window Layout
  async getWindowLayout(): Promise<{ windows: WindowLayoutPayload[] }> {
    const res = await fetch(`${API_BASE}/windows/layout`);
    if (!res.ok) throw new Error('Failed to fetch window layout');
    return res.json();
  },

  async updateWindowLayout(windows: WindowLayoutPayload[]): Promise<void> {
    const res = await fetch(`${API_BASE}/windows/layout`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ windows }),
    });
    if (!res.ok) throw new Error('Failed to update window layout');
  }
};
