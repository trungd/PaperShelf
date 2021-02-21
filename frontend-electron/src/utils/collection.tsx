import { pick } from 'lodash';
import { dataStore } from './store';

class Collection {
  key = 'new-id';

  name = '';

  papers: string[] = [];

  show = true;

  constructor(c: Record<string, unknown>) {
    Object.assign(this, c);
  }

  delete() {
    dataStore.delete(`collections.${this.key}`);
  }

  has(id: string) {
    return this.papers.includes(id);
  }

  toggle(id: string) {
    if (this.has(id)) this.papers = this.papers.filter((s) => s !== id);
    else this.papers = [...this.papers, id];
    this.serialize();
  }

  serialize() {
    dataStore.set(
      `collections.${this.key}`,
      pick(this, ['key', 'name', 'papers', 'show'])
    );
    return this;
  }
}

export function getCollections() {
  const papers: Record<string, unknown>[] | null = dataStore.get('collections');
  if (!papers) return [];
  return Object.entries(papers).map(
    ([key, collection]) =>
      new Collection({
        ...collection,
        key,
      })
  );
}

export function getCollection(key: string) {
  const obj = dataStore.get(`collections.${key}`);
  return obj ? new Collection(obj) : null;
}

export default Collection;
