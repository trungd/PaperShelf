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

const mapDestinations = async (
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
        return [
          name,
          {
            page,
            x: item[2],
            y: item[3],
            z: item[4],
            textStart,
            text: allText[page][textStart],
          },
        ];
      })()
  );
  return Object.fromEntries(await Promise.all(entries));
};

export async function processPdf(pdfUrl: string) {
  if (!pdfUrl) return undefined;
  const pdf = pdfjs.getDocument(pdfUrl);
  const pdfDoc = await pdf.promise;
  if (!pdfDoc) return undefined;
  const maxPages = pdfDoc.numPages;
  const outline = await pdfDoc.getOutline();

  const allText: pdfjs.TextContentItem[][] = [];
  for (let j = 1; j <= maxPages; j += 1) {
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
