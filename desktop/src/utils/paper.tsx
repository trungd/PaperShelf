import { shell, ipcRenderer, app } from 'electron';
import fs from 'fs';
import { pick } from 'lodash';
import {
  Arxiv,
  ArxivPaper,
  SemanticScholar,
  SemanticScholarPaper,
} from './sources';
import Collection from './collection';
import { store, dataStore } from './store';
import { GoogleScholar, GoogleScholarPaper } from './sources/googleScholar';
import { Source, SourcePaper } from './sources/base';

type SimplePaper = {
  title: string;
  authors: string[];
};

class Paper {
  id?: string;

  title?: string;

  pdfUrl?: string;

  localPath?: string;

  inLibrary = false;

  abstract?: string;

  authors: string[] = [];

  keywords?: string[];

  tags: string[] = [];

  zoomPercentage = 100;

  // Populated fields
  year?: string;

  venue?: string;

  venueAndYear?: string;

  authorShort?: string;

  removed = false;

  numCitations = 0;

  citations: string[] = [];

  references: SimplePaper[] = [];

  starred = false;

  autoFill = true;

  thumbnail?: string;

  sources: {
    source: string;
    paper: SourcePaper;
  }[] = [];

  dateAdded?: Date;

  dateModified?: Date;

  constructor(p: Record<string, unknown> | null = null) {
    if (p) {
      Object.assign(this, p);
      this.refresh();
    }
  }

  serialize() {
    this.refresh();

    if (!this.dateAdded) {
      this.dateAdded = new Date();
    }
    this.dateModified = new Date();

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
        'zoomPercentage',
        'numCitations',
        'starred',
        'thumbnail',
        'dateAdded',
        'dateModified',
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
    this.venueAndYear = [this.venue, this.year].join(' ');

    // Populate authorShort
    if (this.authors.length > 2) {
      this.authorShort = `${this.authors[0].split(' ').slice(-1).pop()} et al.`;
    } else {
      this.authorShort = this.authors.join(', ');
    }

    if (!this.id) {
      if (this.authors.length > 0 && this.year && this.title) {
        this.id =
          this.authors[0].split(' ').slice(-1)[0].toLowerCase() +
          this.year +
          this.title.replace(/\W/g, ' ').split(' ')[0].toLowerCase();
      } else {
        this.id = Math.random().toString(36).slice(2);
      }
    }
  }

  static delete(id?: string) {
    dataStore.delete(`papers.${id}`);
  }

  appendTags(tags: string[]) {
    this.tags = [...new Set([...this.tags, ...tags])];
  }

  getTagsByType(tagType: string) {
    const tags = this.tags.filter(
      (t) => /^[a-z0-9]+:.+$/.test(t) && t.split(':')[0] === tagType
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

  toggleStar() {
    this.starred = !this.starred;
    this.serialize();
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
      this.removed = true;
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

  populateFieldsFromSources() {
    this.sources.forEach(
      ({ source, paper }: { source: string; paper: SourcePaper }) => {
        switch (source) {
          case Arxiv.source: {
            const arxivPaper = paper as ArxivPaper;

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
            break;
          }
          case SemanticScholar.source: {
            const semanticPaper = paper as SemanticScholarPaper;
            this.title = this.title || semanticPaper.title;
            this.abstract = this.abstract || semanticPaper.abstract;
            if (this.authors.length === 0)
              this.authors = semanticPaper.authors.map((a) => a.name);
            this.numCitations = this.numCitations || semanticPaper.numCitations;
            this.citations = semanticPaper.citations.map((p) => p.title);
            this.references = semanticPaper.references.map(
              (p) =>
                ({
                  title: p.title,
                  authors: p.authors.map((a) => a.name),
                } as SimplePaper)
            );

            if (semanticPaper.venue)
              this.appendTags([`venue:${semanticPaper.venue}`]);
            if (semanticPaper.year)
              this.appendTags([`year:${semanticPaper.year}`]);
            break;
          }
          case GoogleScholar.source: {
            const googlePaper = paper as GoogleScholarPaper;
            this.title = this.title || googlePaper.title;
            this.abstract = this.abstract || googlePaper.abstract;
            if (this.authors.length === 0)
              this.authors = googlePaper.authors.map((a) => a.name);
            this.numCitations = this.numCitations || googlePaper.numCitations;

            if (googlePaper.venue)
              this.appendTags([`venue:${googlePaper.venue}`]);
            if (googlePaper.year) this.appendTags([`year:${googlePaper.year}`]);
            break;
          }
          default: {
            throw Error('Source not found.');
          }
        }
      }
    );

    this.refresh();
    return this;
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
  const sources = store.get('fetchPaperSources') as string[];
  const promises = sources.map((source) => {
    switch (source) {
      case Arxiv.source:
        return Arxiv.fetch(p.pdfUrl, p.title).then((paper) => {
          p.sources.push({ source, paper });
          return true;
        });
      case SemanticScholar.source:
        return SemanticScholar.fetch(p.pdfUrl, p.title).then((paper) => {
          if (paper) p.sources.push({ source, paper });
          return true;
        });
      default:
        return new Promise(() => {});
    }
  });

  return Promise.all(promises).then(() => {
    return p.populateFieldsFromSources();
  });
}

export async function searchPaper(
  query: string,
  callback: (p: Paper[]) => void
) {
  const sources = store.get('searchPaperSources') as string[];
  return Promise.all(
    ([Arxiv, GoogleScholar] as Source[]).map((s) =>
      sources.includes(s.source)
        ? s.search(query, 0, 10).then((res) =>
            callback(
              res.map((paper: SourcePaper) =>
                new Paper({
                  sources: [{ source: s.source, paper }],
                }).populateFieldsFromSources()
              )
            )
          )
        : null
    )
  ).catch((err) => console.log(err));
}

export default Paper;
