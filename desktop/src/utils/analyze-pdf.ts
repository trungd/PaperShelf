import { pdfjs } from 'react-pdf';

type CitationDestination = {
  name: string;
};

export type PdfInfo = {
  outline: { name: string; items: any[] }[];
  destinations: Record<string, CitationDestination>;
};

function mapOutline(outline: pdfjs.PDFTreeNode[]) {
  if (!outline) return null;
  return outline.map((node: pdfjs.PDFTreeNode) => ({
    name: node.title,
    items: mapOutline(node.items),
  }));
}

async function mapDestinations(
  dest: Record<string, any[]>,
  pdfDoc: pdfjs.PDFDocumentProxy,
  allText: pdfjs.TextContentItem[][]
) {
  const res = {};
  for (let name in dest) {
    const page = await pdfDoc.getPageIndex(dest[name][0]);
    const obj = {
      page,
      x: dest[name][2],
      y: dest[name][3],
      z: dest[name][4],
    };
    obj.textStart = allText[obj.page].findIndex(
      (content) => content.transform[5] <= obj.y
    );
    obj.text = allText[obj.page][obj.textStart];
    res[name] = obj;
  }

  return res;
}

export async function processPdf(pdfUrl: string) {
  if (!pdfUrl) return undefined;
  const pdf = pdfjs.getDocument(pdfUrl);
  const pdfDoc = await pdf.promise;
  if (!pdfDoc) return undefined;
  const maxPages = pdfDoc.numPages;
  const outline = await pdfDoc.getOutline();

  const allText: pdfjs.TextContentItem[][] = [];
  for (var j = 1; j <= maxPages; j++) {
    const page = await pdfDoc.getPage(j);
    // const annotations = await page.getAnnotations();
    const textContent = await page.getTextContent();
    allText.push(textContent.items);
  }

  const destinations = await pdfDoc.getDestinations();
  console.log(allText);

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

  return {
    outline: mapOutline(outline),
    destinations: await mapDestinations(destinations, pdfDoc, allText),
  };
}
