import { useFileSystemStore } from './filesystem.store';
import { useWindowStore } from './window.store';
import { db } from '../services/db.service';

export const initializePersistence = async () => {
  // 1. Load Filesystem Items
  const savedItems = await db.items.toArray();
  if (savedItems.length > 0) {
    useFileSystemStore.setState({ items: savedItems });
  }

  // 2. Load Windows (optional, maybe we don't want to restore all windows on boot)
  // const savedWindows = await db.windows.toArray();
  // if (savedWindows.length > 0) {
  //   useWindowStore.setState({ windows: Object.fromEntries(savedWindows.map(w => [w.id, w])) });
  // }

  // 3. Subscribe to Filesystem changes
  let fsTimeout: any;
  useFileSystemStore.subscribe((state) => {
    clearTimeout(fsTimeout);
    fsTimeout = setTimeout(async () => {
      await db.items.clear();
      await db.items.bulkAdd(state.items);
    }, 500);
  });

  // 4. Subscribe to Window changes (mostly for position/size persistence)
  let winTimeout: any;
  useWindowStore.subscribe((state) => {
    clearTimeout(winTimeout);
    winTimeout = setTimeout(async () => {
      await db.windows.clear();
      await db.windows.bulkPut(Object.values(state.windows));
    }, 500);
  });
};
