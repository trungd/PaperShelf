import React, {
  ElementRef,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';

import { Box, Flex, Popup, Segment } from '@fluentui/react-northstar';
import { ipcRenderer } from 'electron';

import PdfViewerToolbar from './PdfViewerToolbar';
import PaperInfoPopup from './PaperInfoPopup';
import Paper from '../utils/paper';
import { Destination } from '../utils/analyze-pdf';

type PdfViewerProps = {
  width: number;
  paper: Paper | null;
  addToLibrary: (paper) => void;
};

const stringToHighlight = 'deep';

// You might want to merge the items a little smarter than that

function highlightPattern(text: string) {
  const splitText = text.split(' ');

  if (splitText.length <= 1) {
    return text;
  }

  return text;
  // return splitText
  //   .map((t) => [
  //     <span className="word">{t}</span>,
  //     <span
  //       style={{
  //         // backgroundColor: 'rgba(100, 100, 100, 0.2)',
  //         height: '1em',
  //       }}
  //     >
  //       {' '}
  //     </span>,
  //   ])
  //   .flat()
  //   .slice(0, -1);
}

function PdfViewer({ width, paper = null, addToLibrary }: PdfViewerProps) {
  const padLeft = 8;
  const padRight = 0;
  const padTop = 8;

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomPercentage, setZoomPercentage] = useState<number>(100);

  const [viewWidth, setViewWidth] = useState(0);
  const [pageWidth, setPageWidth] = useState<number>();
  const [pageHeight, setPageHeight] = useState<string>();
  const [pageMarginLeft, setPageMarginLeft] = useState<number>(0);

  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [popupInfo, setPopupInfo] = useState<{
    dest: Destination;
  }>();
  const [popupTarget, setPopupTarget] = useState<Element>();

  const container = useRef<ElementRef<'div'>>();
  const pageRef: Record<number, ElementRef<'div'> | null> = {};
  const popperRef = useRef();

  const zoom = (p: number) => {
    setZoomPercentage(p);
    if (!paper) return;
    // const currentWidth = (width - 2 * padding) * p / 100 + 2 * padding;
    // container.current.scrollLeft = (currentWidth - width) / 2;
    paper.zoomPercentage = p;
    paper.serialize();
  };

  const onDocumentLoadSuccess = ({ numPages: num }: { numPages: number }) => {
    setNumPages(num);
    zoom(paper?.zoomPercentage || 1);
  };

  const onItemClick = ({ pageNumber }: { pageNumber: string }) => {
    // console.log(p);
  };

  const onRenderSuccess = async (i: number) => {
    if (!paper) return;
    zoom(paper?.zoomPercentage);
    const pageDom = pageRef[i]?.querySelector(
      'div.react-pdf__Page__textContent'
    ) as HTMLElement;

    if (pageDom) {
      setPageHeight(pageDom.style.height);
    }
    /*
    const text = Array.prototype.slice
      // eslint-disable-next-line react/no-find-dom-node
      .call(ReactDOM.findDOMNode(pageDom)?.childNodes)
      .map((n: Node) => ({
        text: n.textContent,
        fontSize: n.style['font-size'],
        top: n.style.top,
        left: n.style.left,
      }));
    */

    if (!paper.thumbnail) {
      const canvasDom = pageRef[0]?.querySelector(
        'div canvas'
      ) as HTMLCanvasElement;
      if (canvasDom) {
        const url = canvasDom.toDataURL('image/jpg', 0.8);
        const base64Data = url.replace(/^data:image\/png;base64,/, '');
        const path = await ipcRenderer.invoke('save-thumbnail', {
          paper,
          data: base64Data,
        });
        paper.thumbnail = path;
        paper.serialize();
      }
    }
  };

  const onPageLoadSuccess = useCallback(async (page) => {
    const textContent = await page.getTextContent();
    setTextItems(textContent.items);
  }, []);

  const [textItems, setTextItems] = useState();

  const customTextRenderer = useCallback(
    (textItem) => {
      if (!textItems) return undefined;

      const matchInTextItem = textItem.str.match(stringToHighlight);

      return highlightPattern(textItem.str);
      if (matchInTextItem) {
        return highlightPattern(textItem.str);
      }
      return textItem.str;
    },
    [stringToHighlight, textItems]
  );

  useEffect(() => {
    if (!paper) return;
    setPageWidth(((viewWidth - padLeft - padRight) * zoomPercentage) / 100);
    setPageMarginLeft((1 - paper?.zoomPercentage / 100) / 2);
  }, [paper, zoomPercentage, viewWidth]);

  useEffect(() => {
    setViewWidth(width - 16);
  }, [width]);

  const adjustPopperPosition = (el: Element) => {
    const rect = el.getBoundingClientRect();
    console.log(el, rect);
    const dest = el.getAttribute('href')?.slice(1);
    if (dest) {
      setPopupInfo({
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height,
        href: el.getAttribute('href'),
        dest: paper?.pdfInfo?.destinations[dest],
      });
    }
  };

  const onClick = (e: React.MouseEvent) => {
    if (!showPopup) {
      let n = document.querySelector(':hover');
      let el: Element;
      while (n) {
        el = n;
        n = n.querySelector(':hover');
      }
      if (el?.nodeName === 'A') {
        setShowPopup(true);
        setPopupTarget(el);
        adjustPopperPosition(el);
      } else {
        setPopupTarget(undefined);
      }
    }
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (pageHeight) {
      const page = Math.floor(
        e.currentTarget.scrollTop /
          (parseInt(pageHeight.slice(0, -2), 10) + 2 * padTop)
      );
      setCurrentPage(page);
    }
    // TODO: allow scrolling
    // if (popupTarget) adjustPopperPosition(popupTarget);
    setShowPopup(false);
  };

  return (
    <Flex column styles={{ width: '100%', height: '100%' }}>
      <PdfViewerToolbar
        outline={paper?.pdfInfo?.outline}
        zoomPercentage={zoomPercentage}
        zoom={zoom}
        paper={paper}
      />
      <div
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          width: '100%',
          height: 'calc(100% - 32px)',
          padding: `${padTop}px 0 0 ${padLeft}px`,
          backgroundColor: 'gray',
        }}
        onScroll={onScroll}
        onClick={onClick}
        ref={container}
      >
        {false && (
          <Segment
            style={{
              position: 'fixed',
              left: popupInfo?.x,
              top: popupInfo?.y,
              backgroundColor: 'white',
              zIndex: 1000,
            }}
          >
            {popupInfo?.href}
          </Segment>
        )}
        <Popup
          open={showPopup}
          trigger={
            <div
              style={{
                position: 'fixed',
                left: popupInfo?.x,
                top: popupInfo?.y,
                width: popupInfo?.w,
                height: popupInfo?.h,
                zIndex: 1000,
                cursor: 'pointer',
                borderColor: 'red',
              }}
            />
          }
          content={{
            content: (
              <PaperInfoPopup
                paper={popupInfo?.dest?.paper}
                onLoaded={() => popperRef?.current?.updatePosition()}
                addToLibrary={addToLibrary}
              />
            ),
          }}
          onOpenChange={(_, p) => {
            setShowPopup(p?.value);
          }}
          align="center"
          pointing
          on="click"
          // mouseLeaveDelay={200}
          popperRef={popperRef}
        />
        {paper && (
          <Document
            file={paper.getLocalPath() || paper?.pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onItemClick={onItemClick}
            loading={<></>}
            noData={<></>}
          >
            <Flex column gap="gap.small">
              {Array.from(new Array(numPages), (_, i) => (
                <Box
                  key={i}
                  style={{
                    border: 'gray',
                    backgroundColor: 'gray',
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    width: `calc(100% - ${padLeft + padRight})`,
                    height: pageHeight,
                  }}
                >
                  <Box
                    style={{
                      position: 'relative',
                      left: (viewWidth - padLeft - padRight) * pageMarginLeft,
                      backgroundColor: 'white',
                      width: pageWidth,
                    }}
                  >
                    <div
                      className="pdf-page"
                      ref={(el) => {
                        pageRef[i] = el;
                      }}
                    >
                      <Page
                        width={pageWidth}
                        key={`page_${i + 1}`}
                        pageIndex={
                          currentPage - 1 <= i && i <= currentPage + 1
                            ? i
                            : undefined
                        }
                        onRenderSuccess={() => onRenderSuccess(i)}
                        customTextRenderer={customTextRenderer}
                        onLoadSuccess={onPageLoadSuccess}
                        noData={<Box style={{ height: pageHeight }} />}
                        loading={<Box style={{ height: pageHeight }} />}
                      />
                    </div>
                  </Box>
                </Box>
              ))}
            </Flex>
          </Document>
        )}
      </div>
    </Flex>
  );
}

export default PdfViewer;
