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

export async function searchArxiv(
  searchQuery: string,
  start = 0,
  maxResults = 10
) {
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
        abstract: getField('summary', e_1).trim(),
        updated: new Date(getField('updated', e_1)),
        published: new Date(getField('published', e_1)),
        authors: Array.from(e_1.querySelectorAll('author')).map(
          (author) => author.querySelector('name')?.textContent
        ),
        categories: Array.from(
          e_1.querySelectorAll('category')
        ).map((category) => getCategoryName(category.getAttribute('term'))),
      } as ArxivPaper)
  );
}
