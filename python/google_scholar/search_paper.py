import argparse
from scholarly import scholarly, ProxyGenerator
import json

pg = ProxyGenerator()
pg.Tor_Internal(tor_cmd="tor")
# pg.FreeProxies()
scholarly.use_proxy(pg)


def search_paper(query: str):
    return scholarly.search_pubs(query)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Get author's info.")
    parser.add_argument('--query', type=str, help="Search query")
    parser.add_argument('--limit', type=int, default=10)
    parser.add_argument('--offset', type=int, default=0)

    args = parser.parse_args()
    papers = search_paper(args.query)
    count = 0
    res = []
    for p in papers:
        res.append(dict(
            author_id=p['author_id'],
            abstract=p['bib']['abstract'],
            authors=p['bib']['author'],
            year=p['bib']['pub_year'],
            title=p['bib']['title'],
            venue=p['bib']['venue'],
            num_citations=p['num_citations'],
            citedby_url=p['citedby_url'],
            eprint_url=p.get('eprint_url', None),
            gsrank=p['gsrank'],
            pub_url=p['pub_url'],
            # source=res['source'],
            url_add_sclib=p['url_add_sclib'],
            url_scholarbib=p['url_scholarbib']
        ))
        count += 1
        if (count >= args.limit):
            break

    print(json.dumps(res))
