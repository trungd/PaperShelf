import Store from 'electron-store';
import yaml from 'js-yaml';

export const store = new Store({
  defaults: {
    paperLocation: '/Users/trung/PaperDrive',
    dataLocation: '/Users/trung/PaperDrive/data',
    autoDownload: false,
    paperList: {
      liveSearch: false,
      titleFormat: '{title}',
      descFormat: '{authorShort}, {year}',
    },
    view: {
      showSideBar: true,
      sideBarWidth: 300,
    },
    defaultTags: ['year:2020', 'year:2021'],
    toolBar: {
      items: [
        'zoomIn',
        'zoomOut',
        'divider',
        'addToCollection',
        'divider',
        'download',
        'open',
        // 'share',
      ],
    },
  },
  watch: true,
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load,
});

export const dataStore = new Store({
  name: 'data',
  defaults: {
    papers: null,
    collections: [],
  },
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load,
});

// store.clear();
