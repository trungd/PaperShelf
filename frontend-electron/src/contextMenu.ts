import { BrowserWindow } from 'electron';
import contextMenu from 'electron-context-menu';

export default (window: BrowserWindow) => {
  global.contextMenu = {
    itemType: null,
  };

  return contextMenu({
    window,
    prepend: (defaultActions, params, browserWindow) => [
      {
        label: 'Remove from Library',
        role: 'removeFromLibrary',
        visible: global.contextMenu.itemType === 'paper',
        click: () => {},
      },
    ],
  });
};
