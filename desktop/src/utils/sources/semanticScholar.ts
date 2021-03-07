import { getArxivIdFromUrl } from './arxiv';
import { SourcePaper } from './base';

export type SemanticScholarPaper = SourcePaper & {
  id: string;
  arxivId: string;
  title: string;
  url: string;
  venue: string;
  year: string;
  abstract: string;
  authors: {
    authorId: string;
    name: string;
    url: string;
  }[];
  citations: {
    paperId: string;
    arxivId: string;
    title: string;
    authors: {
      authorId: string;
      name: string;
      url: string;
    }[];
    doi: string;
    intent: string[];
    isInfluential: boolean;
    venue: string;
    year: number;
  }[];
  topics: { topic: string; topicId: string; url: string }[];
  numCitations: number;
  citationVelocity: number;
  corpusId: number;
  fieldsOfStudy: string[];
  influentialCitationCount: number;
  references: {
    arxivId: string;
    title: string;
    doi: string;
    intent: string[];
    isInfluential: boolean;
    paperId: string;
    authors: {
      authorId: string;
      name: string;
      url: string;
    }[];
    url: string;
    venue: string;
    year: string;
  }[];
};

export const SemanticScholar = {
  source: 'Semantic Scholar',
  fetch: async (url?: string, title?: string) => {
    if (!url && !title) return undefined;
    if (url) {
      let query;
      const arxivId = getArxivIdFromUrl(url);
      if (arxivId) {
        query = `arxiv:${arxivId}`;
      }

      if (query) {
        const response = await fetch(
          `https://api.semanticscholar.org/v1/paper/${query}`
        );
        const data = await response.json();

        return {
          ...data,
          numCitations: data.citations.length,
        } as SemanticScholarPaper;
      }
    }
    return undefined;
  },
};
