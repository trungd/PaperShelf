import argparse
from scholarly import scholarly
import json


def search_author(name: str):
    return scholarly.search_author(name)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Get author's info.")
    parser.add_argument('--name', type=str, help="Author's name")
    parser.add_argument('--limit', type=int, default=10)
    parser.add_argument('--offset', type=int, default=0)

    args = parser.parse_args()
    authors = search_author(args.name)
    count = 0
    res = []
    for a in authors:
        res.append(dict(
            container_type=a['container_type'],
            scholar_id=a['scholar_id'],
            url_picture=a['url_picture'],
            name=a['name'],
            affiliation=a['affiliation'],
            email_domain=a['email_domain'],
            interests=a['interests'],
            citedby=a['citedby']
        ))
        count += 1
        if count >= args.limit:
            break
    print(json.dumps(res))
