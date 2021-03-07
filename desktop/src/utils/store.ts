import { app } from 'electron';

import Store from 'electron-store';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

export const store = new Store({
  defaults: {
    userDataPath: app?.getPath('userData'),
    dataLocation: app?.getPath('userData'),
    paperLocation: path.join(app?.getPath('downloads') || '.', 'PaperShelf'),
    autoDownload: false,
    paperList: {
      headerFormat: '{title}',
      contentFormat: '{authorShort} ({venueAndYear})',
      expandedHeaderFormat: '{title} ({authorShort}, {venueAndYear})',
      expandedContentFormat: '{abstract}',
    },
    paperSources: {
      'Microsoft Research': {
        primaryKey: null,
        secondaryKey: null,
      },
    },
    searchPaperSources: ['arXiv'],
    fetchPaperSources: ['arXiv', 'Semantic Scholar'],
    searchFields: ['title', 'tags', 'authors', 'abstract'],
    view: {
      showSideBar: true,
      sideBarWidth: 300,
    },
    defaultTags: ['year:2020', 'year:2021'],
    pdfViewerToolbar: ['zoomIn', 'zoomOut', 'divider', 'open'],
    defaultSortBy: 'dateAdded',
    sync: {
      method: 'none',
      googleDrive: {
        code: null,
        lastUpdated: null,
        clientId: null,
        clientSecret: null,
      },
    },
  },
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load,
});

// store.clear();

export const dataStore = new Store({
  name: 'data',
  defaults: {
    papers: null,
    collections: {
      favorites: {
        name: 'Favorites',
        icon: 'star',
      },
      read: {
        name: 'Read',
        icon: 'read',
      },
      'to-read': {
        name: 'To Read',
        icon: 'unread',
      },
    },
  },
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load,
  cwd: store.get('dataLocation'),
});

// store.clear();

export function changeDataStoreCwd(newPath?: string) {
  const root = newPath || store.get('userDataPath');
  fs.writeFile(`${root}/data.yaml`, yaml.dump(dataStore.store), () => {});

  // TODO: require restart
}
