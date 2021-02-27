import { PythonShell } from 'python-shell';
import { Source, SourceAuthor, SourcePaper } from './base';

export type GoogleScholarPaper = SourcePaper & {
  title: string;
  year: string;
  venue: string;
  authors: { name: string }[];
  abstract: string;
  numCitations: number;
};

export type GoogleScholarAuthor = SourceAuthor & {
  affiliation: string;
  urlPicture: string;
  interests: string[];
  scholarId: string;
  emailDomain: string;
};

export const GoogleScholar: Source = {
  source: 'Google Scholar',
  fetch: (url?: string, title?: string) => {},
  search: async (searchQuery: string, start: number, maxResults: number) =>
    new Promise((resolve, reject) => {
      PythonShell.run(
        'search_paper.py',
        {
          mode: 'json',
          scriptPath: '/Users/trung/repos/PaperShelf/python/google_scholar',
          pythonPath: '/Users/trung/repos/PaperShelf/python/venv/bin/python3',
          args: [
            '--query',
            searchQuery,
            '--offset',
            start.toString(),
            '--limit',
            maxResults.toString(),
          ],
        },
        function (err, results) {
          if (err) reject(err);
          return resolve(
            results[0].map((p: Record<string, unknown>) => ({
              title: p.title,
              year: p.year,
              venue: p.venue,
              authors: p.authors.map((a) => ({ name: a })),
              abstract: p.abstract,
              venue: p.venue,
              year: p.year,
            })) as GoogleScholarPaper[]
          );
        }
      );
    }),
  searchAuthor: async (searchQuery: string, start = 0, maxResults = 10) => {
    return new Promise((resolve, reject) => {
      PythonShell.run(
        'search_author.py',
        {
          mode: 'json',
          scriptPath: '/Users/trung/repos/PaperShelf/python/google_scholar',
          pythonPath: '/Users/trung/repos/PaperShelf/python/venv/bin/python3',
          args: [
            '--name',
            searchQuery,
            '--offset',
            start.toString(),
            '--limit',
            maxResults.toString(),
          ],
        },
        function (err, results) {
          if (err) return reject(err);
          return resolve(
            results && results.length > 0
              ? (results[0].map((a: Record<string, unknown>) => ({
                  name: a.name,
                  affiliation: a.affiliation,
                  emailDomain: a.email_domain,
                  scholarId: a.scholar_id,
                  interests: a.interests,
                  numCitations: a.num_citations,
                })) as GoogleScholarAuthor[])
              : []
          );
        }
      );
    });
  },
};
