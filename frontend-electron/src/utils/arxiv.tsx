import categories from './arxiv_categories.json';

export type ArxivPaper = {
  id: string;
  title: string;
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

export function searchArxiv(searchQuery: string, start = 0, maxResults = 10) {
  const pattern = /https:\/\/arxiv.org\/abs\/([0-9]+\.[0-9]+)/;
  const arxivId = pattern.test(searchQuery)
    ? searchQuery.match(pattern)![1]
    : null;

  const normalize = (t: string) => t.toLowerCase().replace(/\W/g, ' ');
  const getField = (field: string, e: Element, defaultValue = '') => {
    const el = e.querySelector(field);
    return el?.textContent || defaultValue;
  };
  const getPdfUrl = (id: string) => `${id.replace('abs', 'pdf')}.pdf`;

  return fetch(
    `http://export.arxiv.org/api/query?${new URLSearchParams({
      ...(arxivId
        ? { id_list: arxivId }
        : { search_query: normalize(searchQuery) }),
      start: start.toString(),
      max_results: maxResults.toString(),
      sortBy: 'relevance',
    }).toString()}`
  )
    .then((response) => response.text())
    .then((str) => new window.DOMParser().parseFromString(str, 'text/xml'))
    .then((data) => {
      const entries = data.querySelectorAll('entry');
      return Array.from(entries).map(
        (e) =>
          ({
            id: getField('id', e).split('/').slice(-1)[0],
            pdfUrl: getPdfUrl(getField('id', e)),
            title: getField('title', e),
            abstract: getField('summary', e).trim(),
            updated: new Date(getField('updated', e)),
            published: new Date(getField('published', e)),
            authors: Array.from(e.querySelectorAll('author')).map(
              (author) => author.querySelector('name')?.textContent
            ),
            categories: Array.from(
              e.querySelectorAll('category')
            ).map((category) => getCategoryName(category.getAttribute('term'))),
          } as ArxivPaper)
      );
    });
}
