import { shell, ipcRenderer } from 'electron';
import fs from 'fs';
import { pick } from 'lodash';
import { ArxivPaper, searchArxiv } from './arxiv';
import Collection from './collection';
import { store, dataStore } from './store';

class Paper {
  id?: string;

  title?: string;

  pdfUrl?: string;

  localPath?: string;

  inLibrary = false;

  arxiv?: {
    url: string;
    updated: string;
    published: string;
  };

  abstract?: string;

  authors: string[] = [];

  keywords?: string[];

  tags: string[] = [];

  zoomPercentage = 100;

  // Populated fields
  year?: string;

  venue?: string;

  authorShort?: string;

  removed = false;

  constructor(p: Record<string, unknown> | null = null) {
    if (p) {
      Object.assign(this, p);
      this.refresh();
    }
  }

  serialize() {
    this.refresh();
    if (!this.id) {
      if (this.authors.length > 0 && this.year && this.title) {
        this.id =
          this.authors[0].split(' ').slice(-1)[0].toLowerCase() +
          this.year +
          this.title.split(' ')[0].toLowerCase();
      } else {
        this.id = Math.random().toString(36).slice(2);
      }
    }

    dataStore.set(
      `papers.${this.id}`,
      pick(this, [
        'id',
        'title',
        'pdfUrl',
        'localPath',
        'inLibrary',
        'abstract',
        'authors',
        'tags',
        'arxiv',
        'zoomPercentage',
      ])
    );
    this.refresh();
  }

  refresh() {
    const getField = (field: string) => {
      const tags = this.getTagsByType(field);
      return tags ? tags[0] : undefined;
    };
    this.year = getField('year');
    this.venue = getField('venue');

    // Populate authorShort
    if (this.authors.length > 2) {
      this.authorShort = `${this.authors[0].split(' ').slice(-1).pop()} et al.`;
    } else {
      this.authorShort = this.authors.join(', ');
    }
  }

  static delete(id?: string) {
    dataStore.delete(`papers.${id}`);
  }

  fromArxivPaper(arxivPaper: ArxivPaper) {
    this.pdfUrl = this.pdfUrl || arxivPaper.pdfUrl;
    this.title = this.title || arxivPaper.title;
    this.abstract = this.abstract || arxivPaper.abstract;
    if (this.authors.length === 0) this.authors = arxivPaper.authors;
    this.appendTags([
      ...arxivPaper.categories,
      ...(arxivPaper.updated
        ? [`year:${arxivPaper.updated.getFullYear()}`]
        : []),
    ]);
    this.refresh();
    return this;
  }

  appendTags(tags: string[]) {
    this.tags = [...new Set([...this.tags, ...tags])];
  }

  getTagsByType(tagType: string) {
    const tags = this.tags.filter(
      (t) => /^[a-z0-9]+:[a-z0-9-]+$/.test(t) && t.split(':')[0] === tagType
    );
    if (tags.length === 0) return null;
    return tags.map((t) => t.split(':').slice(-1)[0]);
  }

  download() {
    const location = `${store.get('paperLocation')}/${this.id}.pdf`;

    ipcRenderer.send('download', {
      url: this.pdfUrl,
      directory: store.get('paperLocation'),
      filename: `${this.id}.pdf`,
    });

    this.localPath = location;
    this.serialize();

    // const noti = new Notification(`Downloaded "${title}"`, {
    //  body: `File saved to "${location}"`,
    // });
    // noti.onclick = () => {
    //  shell.showItemInFolder(location);
    // };
  }

  addToLibrary() {
    this.inLibrary = true;
    if (store.get('autoDownload')) this.download();
    this.serialize();
  }

  inCollection(c?: Collection) {
    if (c) return this.id ? c.has(this.id) : false;
    return this.inLibrary;
  }

  addToCollection(c: Collection) {
    if (!this.id) this.serialize();
    c.addPaper(this.id!);
    this.serialize();
  }

  remove() {
    if (this.id) {
      this.remove = true;
      dataStore.delete(`papers.${this.id}`);
    }
  }

  getLocalPath() {
    if (!this.localPath) return null;
    if (fs.existsSync(this.localPath)) {
      return this.localPath;
    }
    this.localPath = undefined;
    this.serialize();

    return null;
  }

  openPdf() {
    const loc = this.getLocalPath();
    if (loc) {
      shell.openPath(loc);
    }
  }
}

export function getLocalPapers() {
  const papers: Record<string, unknown>[] | null = dataStore.get('papers');
  if (!papers) return [];
  return Object.entries(papers).map(
    ([key, paper]) =>
      new Paper({
        ...paper,
        id: key,
        inLibrary: true,
      })
  );

  /*
  try {
    const fileContents = fs.readFileSync(
      `${store.get('dataLocation')}/papers.yml`,
      'utf8'
    );
    const data = yaml.load(fileContents);
    return Object.entries(data!.papers as Paper[]).map(([key, paper]) => ({
      ...paper,
      id: key,
    }));
  } catch (e) {
    console.log(e);
    return [];
  }
  */
}

export function comparePaperTitle(t1: string, t2: string) {
  const normalize = (t: string) => t.toLowerCase().replace(/\W/g, '');
  return normalize(t1) === normalize(t2);
}

export function getAllTags() {
  // TODO: cache/store tag list if slow
  const papers = getLocalPapers();
  return [
    ...new Set(papers.map((p) => p.tags).flat(1)),
    ...store.get('defaultTags'),
  ];
}

export function getAllAuthors() {
  // TODO: cache/store tag list if slow
  const papers = getLocalPapers();
  return [...new Set(papers.map((p) => p.authors).flat(1))];
}

export function getPaper(id: string) {
  const obj = dataStore.get(`papers.${id}`);
  return obj ? new Paper(obj) : null;
}

export async function fetchPaper(p: Paper) {
  if (p.title) {
    const res = await searchArxiv(p.title, 0, 1);

    if (res.length === 1) {
      const arxivPaper = res[0];
      if (comparePaperTitle(p.title, arxivPaper.title)) {
        p.fromArxivPaper(arxivPaper);
      }
    }
  }
  return p;
}

export default Paper;
