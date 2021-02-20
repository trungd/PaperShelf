import React, { ElementRef, useEffect, useRef, useState } from 'react';

import { Document, Page, pdfjs } from 'react-pdf';
import {
  BookmarkIcon,
  Box,
  DownloadIcon,
  Flex,
  InfoIcon,
  Loader,
  OpenOutsideIcon,
  ShareGenericIcon,
  Toolbar,
  ToolbarItemProps,
  ZoomInIcon,
  ZoomOutIcon,
} from '@fluentui/react-northstar';
import Paper from '../utils/paper';
import { store } from '../utils/store';
import { getCollections } from '../utils/collection';
// right after your imports
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type PdfViewerProps = {
  width: number;
  paper?: Paper;
};

function PdfViewer({ width, paper }: PdfViewerProps) {
  const padLeft = 8;
  const padRight = 0;
  const [toolBarItems, setToolBarItems] = useState<string[]>([]);
  const [menuOpenBookmark, setMenuOpenBookmark] = useState<boolean>();

  const [numPages, setNumPages] = useState(0);
  const [, setCurrentPage] = useState<string>();
  const [zoomPercentage, setZoomPercentage] = useState<number>(100);

  const [viewWidth, setViewWidth] = useState(0);
  const [pageWidth, setPageWidth] = useState<number>();
  const [pageHeight, setPageHeight] = useState<string>();
  const [pageMarginLeft, setPageMarginLeft] = useState<number>(0);

  const container = useRef(null);
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

  const onItemClick = ({ pageNumber }: { pageNumber: string }) => {
    setCurrentPage(pageNumber);
  };

  const onRenderSuccess = (i: number) => {
    if (!paper) return;
    zoom(paper?.zoomPercentage);
    const pageDom = pageRef[i]?.querySelector(
      'div.react-pdf__Page__textContent'
    ) as HTMLElement;

    setPageHeight(pageDom?.style.height);
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
    setToolBarItems(store.get('toolBar.items'));
  }, []);

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
      key: 'bold',
      kind: 'toggle',
      // active: state.bold,
      title: 'Toggle bold',
      onClick: () => {
        zoom(zoomPercentage + 10);
      },
    },
    zoomOut: {
      icon: <ZoomOutIcon />,
      key: 'italic',
      kind: 'toggle',
      // active: state.italic,
      title: 'Toggle italic',
      onClick: () => {
        zoom(zoomPercentage - 10);
      },
    },
    open: {
      icon: <OpenOutsideIcon />,
      key: 'underline',
      kind: 'toggle',
      // active: state.underline,
      title: 'Toggle underline',
      onClick: () => paper?.openPdf(),
    },
    download: {
      icon: <DownloadIcon />,
      key: 'download',
      title: 'Download',
      disabled: !paper,
      onClick: () => paper?.download(),
    },
    info: {
      icon: (
        <InfoIcon
          {...{
            outline: true,
          }}
        />
      ),
      key: 'info',
      title: 'Info',
    },
    share: {
      icon: <ShareGenericIcon />,
      key: 'indent',
      title: 'Indent',
    },
    addToCollection: {
      key: 'collection',
      icon: <BookmarkIcon />,
      title: 'Add to Collection',
      menu: getCollections().map((c) => ({
        key: c.key,
        content: c.name,
      })),
      menuOpen: menuOpenBookmark,
      onMenuOpenChange: (_, p) => setMenuOpenBookmark(p?.menuOpen),
    } as ToolbarItemProps,
  } as Record<string, ToolbarItemProps>;

  return (
    <Flex column styles={{ width: '100%', height: '100%' }}>
      <Toolbar
        aria-label="Default"
        items={toolBarItems.map((name) => allToolBarItems[name])}
      />
      <Box
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          width: '100%',
          height: 'calc(100% - 32px)',
          padding: `${padLeft}px 0 ${padLeft}px ${padLeft}px`,
          backgroundColor: 'gray',
        }}
        ref={container}
      >
        {paper && (
          <Document
            file={paper.getLocalPath() || paper?.pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onItemClick={onItemClick}
            noData={<></>}
          >
            <Flex column gap="gap.small">
              {Array.from(new Array(numPages), (_, i) => (
                <Box
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
                      width: Math.min(
                        ((viewWidth - padLeft - padRight) * zoomPercentage) /
                          100,
                        viewWidth - padLeft - padRight
                      ),
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
                        pageIndex={i === 0 ? i : i}
                        onRenderSuccess={() => onRenderSuccess(i)}
                        noData={
                          <Flex style={{ height: pageHeight }}>
                            <Flex.Item grow>
                              <Loader label="Loading..." />
                            </Flex.Item>
                          </Flex>
                        }
                      />
                    </div>
                  </Box>
                </Box>
              ))}
            </Flex>
          </Document>
        )}
      </Box>
    </Flex>
  );
}

PdfViewer.defaultProps = {
  paper: undefined,
};

export default PdfViewer;
