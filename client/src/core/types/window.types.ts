export type WindowInstance = {
  id: string;
  title: string;
  appType?: string;
  payload?: any;

  position: {
    x: number;
    y: number;
  };

  size: {
    width: number;
    height: number;
  };

  minSize?: {
    width: number;
    height: number;
  };

  previousState?: {
    position: {
      x: number;
      y: number;
    };
    size: {
      width: number;
      height: number;
    };
  };

  minimized: boolean;
  maximized: boolean;
  focused: boolean;

  zIndex: number;
};
