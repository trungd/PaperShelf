import Store from 'electron-store';

export const store = new Store({
  defaults: {
    paperLocation: '/Users/trung/PaperDrive',
    dataLocation: '/Users/trung/PaperDrive/data',
    paperList: {
      liveSearch: false,
      titleFormat: '{title}',
      descFormat: '{authorShort}, {year}'
    }
  }
});

store.clear()
