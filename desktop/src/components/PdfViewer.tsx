import React, { ElementRef, useEffect, useRef, useState } from 'react';

import { Document, Page, pdfjs } from 'react-pdf';
import {
  Box,
  Flex,
  OpenOutsideIcon,
  ShareGenericIcon,
  Toolbar,
  ToolbarItemProps,
  ZoomInIcon,
  ZoomOutIcon,
} from '@fluentui/react-northstar';
import Paper from '../utils/paper';
import { store } from '../utils/store';
// right after your imports
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type PdfViewerProps = {
  width: number;
  paper: Paper | null;
};

function PdfViewer({ width, paper = null }: PdfViewerProps) {
  const padLeft = 8;
  const padRight = 0;
  const padTop = 8;
  const [toolBarItems, setToolBarItems] = useState<string[]>([]);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomPercentage, setZoomPercentage] = useState<number>(100);

  const [viewWidth, setViewWidth] = useState(0);
  const [pageWidth, setPageWidth] = useState<number>();
  const [pageHeight, setPageHeight] = useState<string>();
  const [pageMarginLeft, setPageMarginLeft] = useState<number>(0);

  const container = useRef<ElementRef<'div'>>();
  const pageRef: Record<number, ElementRef<'div'> | null> = {};

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

  // const onItemClick = ({ pageNumber }: { pageNumber: string }) => {
  //   setCurrentPage(parseInt(pageNumber));
  // };

  const onRenderSuccess = (i: number) => {
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
  };

  useEffect(() => {
    setToolBarItems(store.get('pdfViewerToolbar'));
  }, []);

  const onScroll = (e) => {
    if (pageHeight) {
      const page = Math.floor(
        e.target.scrollTop /
          (parseInt(pageHeight.slice(0, -2), 10) + 2 * padTop)
      );
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    if (!paper) return;
    setPageWidth(((viewWidth - padLeft - padRight) * zoomPercentage) / 100);
    setPageMarginLeft((1 - paper?.zoomPercentage / 100) / 2);
  }, [paper, zoomPercentage, viewWidth]);

  useEffect(() => {
    setViewWidth(width - 16);
  }, [width]);

  const allToolBarItems = {
    divider: {
      kind: 'divider',
    },
    zoomIn: {
      icon: <ZoomInIcon />,
      key: 'zoom-in',
      title: 'Zoom In',
      onClick: () => {
        zoom(zoomPercentage + 10);
      },
      disabled: !paper,
    },
    zoomOut: {
      icon: <ZoomOutIcon />,
      key: 'zoom-out',
      title: 'Zoom Out',
      onClick: () => {
        zoom(zoomPercentage - 10);
      },
      disabled: !paper,
    },
    open: {
      icon: <OpenOutsideIcon />,
      key: 'open-default',
      title: 'Open in Default App',
      onClick: () => paper?.openPdf(),
      disabled: !paper,
    },
    share: {
      icon: <ShareGenericIcon />,
      key: 'share',
      title: 'Share',
      disabled: !paper,
    },
  } as Record<string, ToolbarItemProps>;

  return (
    <Flex column styles={{ width: '100%', height: '100%' }}>
      <Toolbar
        aria-label="Default"
        items={toolBarItems.map((name) => allToolBarItems[name])}
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
        ref={container}
      >
        {paper && (
          <Document
            file={paper.getLocalPath() || paper?.pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            // onItemClick={onItemClick}
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
