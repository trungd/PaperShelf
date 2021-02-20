import { pick } from 'lodash';
import { dataStore } from './store';

class Collection {
  key = 'new-id';

  name = '';

  papers: string[] = [];

  constructor(c: Record<string, unknown>) {
    Object.assign(this, c);
  }

  static delete(key: string) {
    dataStore.delete(`collections.${key}`);
  }

  serialize() {
    dataStore.set(`collections.${this.key}`, pick(this, ['id', 'title']));
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
