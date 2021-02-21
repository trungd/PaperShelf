import { BrowserWindow, MenuItemConstructorOptions } from 'electron';
import contextMenu from 'electron-context-menu';

export default (window?: BrowserWindow) => {
  return contextMenu({
    window,
    prepend: () =>
      [
        {
          label: 'Remove from Library',
          // visible: global.contextMenu.itemType === 'paper',
          click: () => {},
        },
      ] as MenuItemConstructorOptions[],
  });
};
