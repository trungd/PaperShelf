export type Paper = {
  id: string;
  title: string;
  pdfUrl?: string;
  arxiv?: {
    url: string;
    updated: string;
    published: string;
  };
  abstract?: string;
  authors: string[];
  year?: number;
  downloaded?: boolean;
  venue?: string;
  keywords?: string[];
  tags: string[];
}
