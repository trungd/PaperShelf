import { shell } from 'electron';
import { store } from './store'
import { Paper } from '../types'
import fs from 'fs';
import yaml from 'js-yaml';

export function getAuthorShort(authorList: string[]) {
  if (authorList.length > 2) {
    return authorList[0].split(' ').slice(-1).pop() + ' et al.'
  } else {
    return authorList.join(', ')
  }
}

export function downloadPaper({ id, title }: Paper) {
  const location = store.get('paperLocation') + `/${id}.pdf`

  // TODO: Download paper
  const noti = new Notification(`Downloaded ${title}`, {
    body: `File saved to ${location}`
  })
  noti.onclick = () => {
    shell.showItemInFolder(location)
  }
}

export function getPaperLocation({ id }: Paper) {
  const location = store.get('paperLocation') + `/${id}.pdf`;
  if (fs.existsSync(location)) {
    return location;
  } else {
    return null;
  }
}

export function openPdf(paper: Paper) {
  const loc = getPaperLocation(paper);
  if (loc) {
    shell.openPath(loc);
  }
}

export function getLocalPapers() {
  try {
    let fileContents = fs.readFileSync(store.get('dataLocation') + '/papers.yml', 'utf8');
    let data = yaml.load(fileContents);
    return Object.entries(data!.papers as Paper[]).map(
      ([key, paper]) => ({
        ...paper,
        id: key
      })
    )
  } catch (e) {
    console.log(e);
    return []
  }
}

export function searchArxiv(searchQuery: string) {
  const getField = (field: string, e: Element) => e.querySelector(field)?.textContent!;
  const getPdfUrl = (id: string) => id.replace('abs', 'pdf') + '.pdf';

  return fetch(`http://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}`)
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      const entries = data.querySelectorAll("entry")
      return Array.from(entries).map(e => ({
        id: getField('id', e).split('/').slice(-1)[0],
        arxiv: {
          url: getField('id', e),
          updated: getField('updated', e),
          published: getField('published', e),
        },
        url: getPdfUrl(getField('id', e)),
        title: getField('title', e),
        abstract: getField('abstract', e),
        authors: Array.from(e.querySelectorAll('author')).map(author => author.querySelector('name')?.textContent),
        tags: []
      } as Paper))
    })
}
