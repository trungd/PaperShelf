import { remote } from 'electron';

const { dialog } = remote;

export function showError(err) {
  dialog.showMessageBox(remote.getCurrentWindow(), {
    message: err.message,
  });
}

export function showMessage(msg: string) {
  dialog.showMessageBox(remote.getCurrentWindow(), {
    message: msg,
  });
}
