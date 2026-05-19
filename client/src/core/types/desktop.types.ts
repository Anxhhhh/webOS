export type DesktopItemType = 'file' | 'folder';

export type DesktopItem = {
  id: string;
  name: string;
  type: DesktopItemType;
  createdAt: number;
};
