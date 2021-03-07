import categories from '../arxiv_categories.json';
import { SourcePaper } from './base';

export function comparePaperTitle(t1: string, t2: string) {
  const normalize = (t: string) => t.toLowerCase().replace(/\W/g, '');
  return normalize(t1) === normalize(t2);
}

export type ArxivPaper = SourcePaper & {
  id: string;
  url: string;
  pdfUrl: string;
  updated: Date;
  published: Date;
  abstract: string;
  authors: string[];
  categories: string[];
};

const getCategoryName = (id: string) => {
  const res = (categories as {
    id: string;
    name: string;
  }[]).filter((c) => c.id === id);
  if (res.length === 1) {
    return res[0].name.replaceAll(' ', '-').toLowerCase();
  }
  return id;
};

export function getArxivIdFromUrl(url: string) {
  const pattern = /^https?:\/\/arxiv.org\/(?:abs\/([0-9]+\.[0-9]+)(?:v[0-9]+)?|pdf\/([0-9]+\.[0-9]+)(?:v[0-9]+)?\.pdf)$/;
  if (pattern.test(url)) {
    const matches = url.match(pattern)!;
    return matches[1] || matches[2];
  }
  return null;
}

export const Arxiv = {
  source: 'arXiv',
  async search(searchQuery: string, start = 0, maxResults = 10) {
    const arxivId = getArxivIdFromUrl(searchQuery);

    const normalize = (t: string) => t.toLowerCase().replace(/\W/g, ' ');
    const getField = (field: string, e: Element, defaultValue = '') => {
      const el = e.querySelector(field);
      return el?.textContent || defaultValue;
    };
    const getPdfUrl = (id: string) => `${id.replace('abs', 'pdf')}.pdf`;

    const response = await fetch(
      `http://export.arxiv.org/api/query?${new URLSearchParams({
        ...(arxivId
          ? { id_list: arxivId }
          : { search_query: normalize(searchQuery) }),
        start: start.toString(),
        max_results: maxResults.toString(),
        sortBy: 'relevance',
      }).toString()}`
    );
    const str = await response.text();
    const data = new window.DOMParser().parseFromString(str, 'text/xml');
    const entries = data.querySelectorAll('entry');
    return Array.from(entries).map(
      (e_1) =>
        ({
          id: getField('id', e_1).split('/').slice(-1)[0],
          pdfUrl: getPdfUrl(getField('id', e_1)),
          title: getField('title', e_1),
          abstract: getField('summary', e_1).trim().split('\n').join(' '),
          updated: new Date(getField('updated', e_1)),
          published: new Date(getField('published', e_1)),
          authors: Array.from(e_1.querySelectorAll('author')).map(
            (author) => author.querySelector('name')?.textContent
          ),
          categories: Array.from(
            e_1.querySelectorAll('category')
          ).map((category) => getCategoryName(category.getAttribute('term')!)),
        } as ArxivPaper)
    );
  },
  async fetch(url?: string, title?: string) {
    if (url) {
      const arxivId = getArxivIdFromUrl(url);
      if (arxivId) {
        const res = await this.search(url);
        if (res.length === 1) {
          const arxivPaper = res[0];
          return arxivPaper;
        }
      }
    } else if (title) {
      const res = await this.search(title, 0, 1);
      if (res.length === 1) {
        const arxivPaper = res[0];
        if (comparePaperTitle(title || '', arxivPaper.title)) {
          return arxivPaper;
        }
      }
    }
    return undefined;
  },
  getPdfUrlFromId(id: string) {
    return `https://arxiv.org/pdf/${id}.pdf`;
  },
};
