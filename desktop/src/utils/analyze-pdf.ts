import { pdfjs } from 'react-pdf';
import Paper from './paper';

export type Destination = {
  name: string;
  paper: Paper;
  page: number;
};

export type Annotation = {
  id: string;
  dest: string;
};

export type PdfInfo = {
  outline: { name: string; items: any[] }[];
  destinations: Record<string, Destination>;
  annotations: Annotation[][];
};

function mapOutline(outline: pdfjs.PDFTreeNode[]) {
  if (!outline) return null;
  return outline.map((node: pdfjs.PDFTreeNode) => ({
    name: node.title,
    items: mapOutline(node.items),
  }));
}

const normalize = (s: string) =>
  s
    .trim()
    .replace(/\s+/, ' ')
    .replace(/\s([,.])\s/, /$1 /)
    .replace(/\-\s/, '-');

const score = function (a: string, b: string) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  a = a.slice(0, a.length);

  const matrix = [];

  // increment along the first column of each row
  let i;
  for (i = 0; i <= b.length; i += 1) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  let j;
  for (j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i += 1) {
    for (j = 1; j <= a.length; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          // matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const mapDestinations = async (
  paper: Paper,
  dest: Record<string, any[]>,
  pdfDoc: pdfjs.PDFDocumentProxy,
  allText: pdfjs.TextContentItem[][]
) => {
  const entries = Object.entries(dest).map(
    ([name, item]: [name: string, item: any]) =>
      (async () => {
        const page = await pdfDoc.getPageIndex(item[0]);
        const textStart = allText[page].findIndex(
          (content) => content.transform[5] <= item[3]
        );

        const texts: string[] = [];
        if (textStart > -1) {
          let curText: string[] = [];
          let curTop = allText[page][textStart].transform[5];

          for (let i = textStart; i < allText[page].length; i += 1) {
            const txt = allText[page][i];
            if (txt.transform[5] === curTop) {
              curText.push(txt.str);
            } else {
              texts.push(curText.join(' '));
              curText = [txt.str];
              curTop = txt.transform[5];
            }
            if (texts.length > 5) break;
          }
        }

        const extractFns = [
          (txt: string) => {
            const match = txt.match(/^(\[\d+\].*?)\\\\\[\d+\]/);
            return match ? match[1] : null;
          },
        ];

        const textContentArr = (extractFns
          .map((fn) => fn(texts.map((t) => t.trim()).join('\\\\')))
          .filter(
            (s: string | null) => s != null
          ) as string[]).map((s: string) => s?.split('\\\\').join(' '));
        const textContent =
          textContentArr.length > 0 ? normalize(textContentArr[0]) : undefined;

        const query = textContent;
        let citedPaper = null;
        if (query) {
          const p = paper.references
            .map((ref) => ({
              ref,
              score: score(query, `${ref.authors.join(', ')} ${ref.title}`),
            }))
            .sort((a, b) => a.score - b.score)[0];

          citedPaper = p?.ref;
          console.log(citedPaper);
        }

        return [
          name,
          {
            page,
            x: item[2],
            y: item[3],
            z: item[4],
            textStart,
            text: textContent,
            paper: citedPaper,
          } as Destination,
        ];
      })()
  );
  return Object.fromEntries(await Promise.all(entries)) as Record<
    string,
    Destination
  >;
};

export async function processPdf(paper: Paper) {
  // if (paper.pdfInfo) return;
  if (!paper.pdfUrl) return paper;
  const pdf = pdfjs.getDocument(paper.pdfUrl); // TODO: read from downloaded files
  const pdfDoc = await pdf.promise;
  if (!pdfDoc) return undefined;
  const maxPages = pdfDoc.numPages;
  const outline = await pdfDoc.getOutline();

  const allText: pdfjs.TextContentItem[][] = [];
  const allAnnotations: pdfjs.PDFAnnotationData[][] = [];
  for (let j = 1; j <= maxPages; j += 1) {
    const page = await pdfDoc.getPage(j);
    const annotations = (await page.getAnnotations()) as pdfjs.PDFAnnotationData[];
    const textContent = await page.getTextContent();
    allText.push(textContent.items);
    allAnnotations.push(annotations);
    /* Sample:
    annotationFlags: 0
    annotationType: 2
    borderStyle: {width: 0, style: 1, dashArray: Array(1), horizontalCornerRadius: 0, verticalCornerRadius: 0}
    color: Uint8ClampedArray(3) [0, 255, 0]
    contents: ""
    dest: "cite.mcmahan2016communication"
    hasAppearance: false
    id: "74R"
    modificationDate: null
    rect: (4) [456.698, 275.129, 468.653, 286.032]
    subtype: "Link"
    */
  }

  const destinations = await pdfDoc.getDestinations();

  // const referenceStart = allText.findIndex(
  //   (text) => text.str.toLowerCase() === 'references'
  // );
  // const fontHeight = allText[referenceStart + 1].height;
  // const referenceCount = allText
  //   .slice(referenceStart + 1)
  //   .findIndex((text) => text.height > fontHeight && text.str.length > 2);
  // console.log(referenceStart, referenceCount);
  // const references = allText.slice(
  //   referenceStart + 1,
  //   referenceCount === -1 ? allText.length : referenceStart + 2 + referenceCount
  // );
  // console.log(references);

  paper.pdfInfo = {
    outline: mapOutline(outline),
    destinations: await mapDestinations(paper, destinations, pdfDoc, allText),
    annotations: allAnnotations.map((pageAnn) =>
      pageAnn.map((ann) => ({
        annotationFlags: ann.annotationFlags,
        annotationType: ann.annotationType,
        dest: ann.dest,
        id: ann.id,
        rect: ann.rect,
      }))
    ),
  };

  return paper;
}
