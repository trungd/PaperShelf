import { BrowserWindow } from 'electron';

export function showPreferences(parent?: BrowserWindow) {
  const win = new BrowserWindow({
    title: 'Preferences',
    width: 500,
    height: 600,
    minWidth: 500,
    minHeight: 600,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    parent,
    modal: false,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    show: false,
  });

  win.loadURL(`file://${__dirname}/../index.html#/preferences`);
  win.once('ready-to-show', () => {
    win.show();
  });
}

export function showAbout() {}
