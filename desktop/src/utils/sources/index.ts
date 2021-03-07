import { Arxiv } from './arxiv';
import { GoogleScholar } from './googleScholar';
import { SemanticScholar } from './semanticScholar';

export * from './googleScholar';
export * from './semanticScholar';
export * from './arxiv';

export const Sources = {
  arXiv: Arxiv,
  'Google Scholar': GoogleScholar,
  'Semantic Scholar': SemanticScholar,
};
