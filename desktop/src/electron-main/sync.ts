import { BrowserWindow, dialog } from 'electron';
import { store } from '../utils/store';
import _syncGoogleDrive from '../utils/sync/google-drive/sync';

export const syncGoogleDrive = (mainWindow: BrowserWindow) => {
  const showAuthWin = (authUrl: string) =>
    new Promise((resolve, reject) => {
      const code = store.get('sync.googleDrive.code') as string;
      if (code) resolve(code);
      const window = new BrowserWindow({
        title: 'PaperShelf',
        show: true,
        modal: true,
        webPreferences: {
          webSecurity: false,
        },
      });
      window.loadURL(authUrl, { userAgent: 'Chrome' });
      window.webContents.on('will-navigate', function (event, newUrl) {
        console.log(newUrl);
        const url = decodeURIComponent(newUrl);
        const match = url.match(/approvalCode=(.*)/);
        console.log(match);
        if (match?.length > 0) {
          resolve(match[1]);
        }
        // More complex code to handle tokens goes here
      });
    });

  const showMsgBox = (message: string) =>
    dialog.showMessageBox(mainWindow, {
      title: 'Sync',
      type: 'error',
      message,
    });
  _syncGoogleDrive(showMsgBox);
};
