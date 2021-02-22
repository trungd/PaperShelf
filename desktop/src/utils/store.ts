import { app } from 'electron';

import Store from 'electron-store';
import yaml from 'js-yaml';
import path from 'path';

export const store = new Store({
  defaults: {
    paperLocation: path.join(app?.getPath('home') || '.', 'PaperShelf'),
    autoDownload: false,
    paperList: {
      titleFormat: '{title}',
      descFormat: '{authorShort}, {year}',
    },
    searchFields: ['title', 'tags', 'authors', 'abstract'],
    search: {
      live: false,
    },
    view: {
      showSideBar: true,
      sideBarWidth: 300,
    },
    defaultTags: ['year:2020', 'year:2021'],
    pdfViewerToolbar: [
      'zoomIn',
      'zoomOut',
      'divider',
      'open',
      // 'share',
    ],
  },
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load,
});

export const dataStore = new Store({
  name: 'data',
  defaults: {
    papers: null,
    collections: null,
  },
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load,
});

// store.clear();
