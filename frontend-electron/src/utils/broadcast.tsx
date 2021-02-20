import { ipcRenderer } from 'electron';
import Paper from './paper';

export function openModalEditPaper(p?: Paper) {
  ipcRenderer.send('modal-edit-paper', p);
}

export function openModalAbout() {
  ipcRenderer.send('modal-about');
}
