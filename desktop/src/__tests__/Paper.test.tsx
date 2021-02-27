import '@testing-library/jest-dom';
import Paper from '../utils/paper';
import { SourceAuthor, SourcePaper } from '../utils/sources/base';
import {
  GoogleScholar,
  GoogleScholarAuthor,
  GoogleScholarPaper,
} from '../utils/sources/googleScholar';

describe('Paper', () => {
  it('should generate id', () => {
    const p = new Paper({
      title: 'hello',
      authors: ['me'],
      tags: ['year:2015', 'venue:ICML'],
    });
    p.refresh();
    expect(p.id).toEqual('me2015hello');
    expect(p.year).toEqual('2015');
    expect(p.venue).toEqual('ICML');
    expect(p.venueAndYear).toEqual('ICML 2015');
  });
});

describe('Google Scholar', () => {
  it('should return paper search results', () => {
    return GoogleScholar.search('deep learning', 0, 10).then(
      (res: SourcePaper[]) => {
        expect(res.length).toEqual(10);
        const p = res[0] as GoogleScholarPaper;
        expect(p.title).toContain('Deep learning');
        expect(p.year).toEqual('2016');
        expect(p.venue).toEqual('NA');
        expect(p.authors.length).toEqual(4);
        expect(p.abstract).not.toBe('');
        return true;
      }
    );
  });

  it('should return author search results', () => {
    return GoogleScholar.searchAuthor('Jon Kleinberg', 0, 10).then(
      (res: SourceAuthor[]) => {
        const a = res[0] as GoogleScholarAuthor;
        expect(a.name).toEqual('Jon Kleinberg');
        expect(a.affiliation).toContain('University');
        expect(a.emailDomain).toContain('.edu');
        expect(a.scholarId).not.toBeNull();
        expect(a.interests).toContain('algorithms');
        return true;
      }
    );
  });
});
