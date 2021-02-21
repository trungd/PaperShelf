import { BrowserWindow, ipcRenderer } from 'electron';
import Paper from './paper';

export function openModalEditPaper(p?: Paper) {
  ipcRenderer.send('modal-edit-paper', p);
}

export function openModalAbout() {
  ipcRenderer.send('modal-about');
}

export function toggleDistractionFreeMode(win: BrowserWindow) {
  win.webContents.send('toggle-distraction-free');
}

export function onToggleDistractionFreeMode(fn: () => void) {
  ipcRenderer.on('toggle-distraction-free', () => fn());
}
