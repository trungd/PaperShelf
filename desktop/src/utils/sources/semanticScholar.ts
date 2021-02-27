import { getArxivIdFromUrl } from './arxiv';
import { SourcePaper } from './base';

export type SemanticScholarPaper = SourcePaper & {
  id: string;
  title: string;
  topics: string[];
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
  numCitations: number;
  citationVelocity: number;
  corpusId: number;
  fieldsOfStudy: string[];
  influentialCitationCount: number;
  references: {
    title: string;
    authors: {
      authorId: string;
      name: string;
      url: string;
    }[];
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
          id: data.paperId,
          title: data.title,
          topics: data.topics.map((t: { topic: string }) => t.topic),
          url: data.url,
          venue: data.venue,
          year: data.year,
          abstract: data.abstract,
          citations: data.citations,
          references: data.references,
          authors: data.authors,
          numCitations: data.citations.length,
          citationVelocity: data.citationVelocity,
          corpusId: data.corpusId,
          fieldsOfStudy: data.fieldsOfStudy,
          influentialCitationCount: data.influentialCitationCount,
        } as SemanticScholarPaper;
      }
    }
    return undefined;
  },
};
