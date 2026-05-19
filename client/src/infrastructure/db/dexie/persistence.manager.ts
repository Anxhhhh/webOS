import { useFileSystemStore } from '@/features/filesystem/store/filesystem.store';
import { useWindowStore } from '@/features/window-manager/store/window.store';
import { db } from '@/infrastructure/db/dexie/db.service';
import { api } from '@/shared/lib/api';

export const initializePersistence = async () => {
  let isOnline = false;

  // 1. Filesystem Synchronization on boot
  try {
    console.log('Attempting to sync filesystem with server...');
    const serverData = await api.getTree();
    isOnline = true;
    
    // Get local version
    const localVersionRecord = await db.settings.get('fs_version');
    const localVersion = localVersionRecord ? String(localVersionRecord.value) : null;
    const localItems = await db.items.toArray();

    console.log(`Server version: ${serverData.version}, Local version: ${localVersion}`);

    // If server version is newer or local is empty, server-wins overwrite
    if (serverData.version !== localVersion || localItems.length === 0) {
      console.log('Server version mismatch or local DB empty. Overwriting local state with server state...');
      await db.transaction('rw', [db.items, db.settings], async () => {
        await db.items.clear();
        await db.items.bulkAdd(serverData.items);
        await db.settings.put({ id: 'fs_version', value: serverData.version });
      });
      useFileSystemStore.getState().setItemsAndVersion(serverData.items, serverData.version);
    } else {
      console.log('Local version matches server. Loading from IndexedDB...');
      useFileSystemStore.getState().setItemsAndVersion(localItems, localVersion);
    }
  } catch (err) {
    console.error('Failed to sync filesystem with server on boot. Running in local-first/offline mode.', err);
    // Offline fallback
    try {
      const savedItems = await db.items.toArray();
      const localVersionRecord = await db.settings.get('fs_version');
      const localVersion = localVersionRecord ? String(localVersionRecord.value) : null;
      
      if (savedItems.length > 0) {
        useFileSystemStore.getState().setItemsAndVersion(savedItems, localVersion);
      }
    } catch (dbErr) {
      console.error('Failed to load filesystem from IndexedDB fallback.', dbErr);
    }
  }

  // 2. Window Layout Sync on boot
  try {
    if (isOnline) {
      console.log('Attempting to sync window layout from server...');
      const serverLayout = await api.getWindowLayout();
      if (serverLayout.windows && serverLayout.windows.length > 0) {
        useWindowStore.setState({
          windows: Object.fromEntries(serverLayout.windows.map(w => [w.id, {
            ...w,
            minimized: w.minimized ?? false,
            maximized: w.maximized ?? false,
            focused: false // Focus will be determined on interaction
          }]))
        });
      }
    } else {
      // Offline fallback: load from IndexedDB
      const savedWindows = await db.windows.toArray();
      if (savedWindows.length > 0) {
        useWindowStore.setState({
          windows: Object.fromEntries(savedWindows.map(w => [w.id, w]))
        });
      }
    }
  } catch (err) {
    console.error('Failed to load window layout on boot.', err);
    // Offline fallback
    try {
      const savedWindows = await db.windows.toArray();
      if (savedWindows.length > 0) {
        useWindowStore.setState({
          windows: Object.fromEntries(savedWindows.map(w => [w.id, w]))
        });
      }
    } catch (e) {}
  }

  // 3. Subscribe to Filesystem changes (IndexedDB write)
  let fsTimeout: any;
  useFileSystemStore.subscribe((state) => {
    clearTimeout(fsTimeout);
    fsTimeout = setTimeout(async () => {
      try {
        await db.transaction('rw', [db.items, db.settings], async () => {
          await db.items.clear();
          await db.items.bulkAdd(state.items);
          if (state.version) {
            await db.settings.put({ id: 'fs_version', value: state.version });
          }
        });
      } catch (err) {
        console.error('Failed to persist filesystem items to IndexedDB.', err);
      }
    }, 500);
  });

  // 4. Subscribe to Window changes (IndexedDB write & Server sync)
  let winLocalTimeout: any;
  let winServerTimeout: any;
  
  useWindowStore.subscribe((state) => {
    // A. Local IndexedDB write (debounced 500ms)
    clearTimeout(winLocalTimeout);
    winLocalTimeout = setTimeout(async () => {
      try {
        await db.windows.clear();
        await db.windows.bulkPut(Object.values(state.windows));
      } catch (err) {
        console.error('Failed to persist windows to IndexedDB.', err);
      }
    }, 500);

    // B. Server sync (debounced 1500ms)
    clearTimeout(winServerTimeout);
    winServerTimeout = setTimeout(async () => {
      try {
        const windowsList = Object.values(state.windows).map(w => ({
          id: w.id,
          appType: w.appType,
          payload: w.payload,
          position: w.position,
          size: w.size,
          maximized: w.maximized,
          minimized: w.minimized,
          zIndex: w.zIndex
        }));
        await api.updateWindowLayout(windowsList);
      } catch (err) {
        console.error('Failed to sync window layout to server in background.', err);
      }
    }, 1500);
  });
};
