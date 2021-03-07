import { shell, ipcRenderer, app } from 'electron';
import fs from 'fs';
import { pick } from 'lodash';
import yaml from 'js-yaml';
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
import { Annotation, Destination, processPdf } from './analyze-pdf';

type SimplePaper = {
  title: string;
  authors: string[];
  venue: string;
  year: string;
  pdfUrl: string;
};

class Paper {
  id?: string;

  arxivId?: string;

  title?: string;

  pdfUrl?: string;

  localPath?: string;

  inLibrary = false;

  abstract?: string;

  authors: string[] = [];

  keywords?: string[];

  tags: string[] = [];

  customTags: string[] = [];

  zoomPercentage = 100;

  // Populated fields
  year?: string;

  venue?: string;

  venueAndYear?: string;

  authorShort?: string;

  removed = false;

  numCitations = 0;

  citations: SimplePaper[] = [];

  references: SimplePaper[] = [];

  starred = false;

  autoFill = true;

  thumbnail?: string;

  sources: Record<string, SourcePaper> = {};

  dateAdded?: Date;

  dateModified?: Date;

  dateFetched?: Date;

  isFetching = false;

  cachePath?: string;

  pdfInfo?: {
    outline: { name: string; items: any[] }[];
    destinations: Record<string, Destination>;
    annotations: Annotation[][];
  };

  read = false;

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
        'year',
        'venue',
        'pdfUrl',
        'localPath',
        'inLibrary',
        'authors',
        'tags',
        'zoomPercentage',
        'numCitations',
        'starred',
        'thumbnail',
        'dateAdded',
        'dateModified',
        'read',
      ])
    );
    this.refresh();
  }

  saveCache() {
    this.refresh();
    if (this.cachePath) {
      fs.mkdir(
        `${store.get('dataLocation')}/cache`,
        { recursive: true },
        (err) => {
          if (err) throw err;
        }
      );
      fs.writeFileSync(
        this.cachePath,
        yaml.dump(
          pick(this, [
            'citations',
            'abstract',
            'pdfInfo',
            'references',
            'sources',
          ])
        )
      );
    }
  }

  loadCache() {
    if (this.cachePath) {
      try {
        const data = fs.readFileSync(this.cachePath);
        Object.assign(this, yaml.load(data));
        this.refresh();
      } catch (e) {}
    }
  }

  refresh() {
    this.tags = [
      ...new Set(
        this.tags
          .map((s) => s?.toLowerCase().replace(/\s+/, '-'))
          .filter((s) => s)
      ),
    ];
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

    this.cachePath = `${store.get('dataLocation')}/cache/${this.id}.yaml`;
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

  async addToLibrary() {
    this.inLibrary = true;
    if (store.get('autoDownload')) this.download();
    await this.fetch();
    this.serialize();
    this.saveCache();
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

  async fetch() {
    this.isFetching = true;
    await fetchPaper(this);
    await processPdf(this);
    this.dateFetched = new Date();
    this.serialize();
    this.saveCache();
    this.isFetching = false;
    return this;
  }

  populateFieldsFromSources() {
    this.tags = [];
    Object.entries(this.sources).forEach(
      ([source, paper]: [source: string, paper: SourcePaper]) => {
        switch (source) {
          case Arxiv.source: {
            const arxivPaper = paper as ArxivPaper;

            this.pdfUrl = this.pdfUrl || arxivPaper.pdfUrl;
            this.title = this.title || arxivPaper.title;
            this.abstract = this.abstract || arxivPaper.abstract;
            this.year =
              this.year || arxivPaper.updated.getFullYear().toString();
            if (this.authors.length === 0) this.authors = arxivPaper.authors;
            this.appendTags(arxivPaper.categories);
            break;
          }
          case SemanticScholar.source: {
            const semanticPaper = paper as SemanticScholarPaper;
            this.title = this.title || semanticPaper.title;
            this.arxivId = this.arxivId || semanticPaper.arxivId;
            this.abstract = this.abstract || semanticPaper.abstract;
            if (this.authors.length === 0)
              this.authors = semanticPaper.authors.map((a) => a.name);
            this.numCitations = this.numCitations || semanticPaper.numCitations;
            this.citations = semanticPaper.citations.map((p) => ({
              title: p.title,
              authors: p.authors.map((a) => a.name),
              venue: p.venue,
              year: p.year,
              pdfUrl: p.arxivId ? Arxiv.getPdfUrlFromId(p.arxivId) : undefined,
            }));
            this.references = semanticPaper.references.map(
              (p) =>
                ({
                  title: p.title,
                  authors: p.authors.map((a) => a.name),
                  venue: p.venue,
                  year: p.year,
                  pdfUrl: p.arxivId
                    ? Arxiv.getPdfUrlFromId(p.arxivId)
                    : undefined,
                } as SimplePaper)
            );

            this.year = this.year || semanticPaper.year;
            this.venue = this.venue || semanticPaper.venue;
            if (semanticPaper.topics)
              this.appendTags(semanticPaper.topics.map((t) => t.topic));
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
            break;
          }
        }
      }
    );

    this.refresh();
    return this;
  }

  getCitedPaperFromText(txt: string) {
    if (!this.references) return undefined;
    return this.references[0];
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
  p.sources = {};
  const promises = sources.map((source) => {
    switch (source) {
      case Arxiv.source:
        return Arxiv.fetch(p.pdfUrl, p.title).then((paper) => {
          if (paper) p.sources[source] = paper;
          return true;
        });
      case SemanticScholar.source:
        return SemanticScholar.fetch(p.pdfUrl, p.title).then((paper) => {
          if (paper) p.sources[source] = paper;
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

export function searchPaper(query: string, callback: (p: Paper[]) => void) {
  const sources = store.get('searchPaperSources') as string[];
  return Promise.all(
    sources.map((source) => {
      switch (source) {
        case Arxiv.source:
          return Arxiv.search(query, 0, 10).then((res) =>
            callback(
              res.map((paper: SourcePaper) =>
                new Paper({
                  sources: { [source]: paper },
                }).populateFieldsFromSources()
              )
            )
          );
        case GoogleScholar.source:
          return GoogleScholar.search(query, 0, 10).then((res) =>
            callback(
              res.map((paper: SourcePaper) =>
                new Paper({
                  sources: { [source]: paper },
                }).populateFieldsFromSources()
              )
            )
          );
        default: {
          return null;
        }
      }
    })
  ).catch((err) => console.log(err));
}

export default Paper;
