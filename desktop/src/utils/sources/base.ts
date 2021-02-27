export type SourcePaper = {
  title: string;
};

export type SourceAuthor = {
  name: string;
};

export type Source = {
  source: string;
  search: (
    searchQuery: string,
    start: number,
    maxResults: number
  ) => Promise<SourcePaper[]>;
  searchAuthor: (
    searchQuery: string,
    start: number,
    maxResults: number
  ) => Promise<SourceAuthor[]>;
  fetch: (url?: string, title?: string) => Promise<SourcePaper>;
};
