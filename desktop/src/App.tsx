import { throttle } from 'lodash';
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Flex, Box } from '@fluentui/react-northstar';
import PdfViewer from './components/PdfViewer';
import PaperList from './components/PaperList';
import './App.global.css';

import PaperInfo from './components/PaperInfo';
import Paper, { getLocalPapers } from './utils/paper';
import { store } from './utils/store';
import About from './views/about';
import Preferences from './views/preferences';

enum View {
  Regular,
  SideBarOnly,
  PdfViewerOnly,
  DistractionFree,
}

const Main = () => {
  const [height, setHeight] = useState<number>(0);
  const [sideBarWidth, setSideBarWidth] = useState<number>(300);
  const [pdfWidth, setPdfWidth] = useState<number>(0);

  const [showPaperInfo, setShowPaperInfo] = useState<boolean>(false);
  const [view, setView] = useState<View>(View.Regular);

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);

  const loadPapers = () => setAllPapers(getLocalPapers());

  const addToLibrary = (paper: Paper) => {
    if (!allPapers.map((p) => p.id).includes(paper.id)) {
      paper.addToLibrary();
      paper.serialize();
      setAllPapers([...allPapers, paper]);
    }
  };

  useEffect(() => {
    /*
    onToggleDistractionFreeMode(() => {
      if (isDistractionFree) {
        setIsDistractionFree(false);
        setShowSideBar(true);
        setSideBarWidth(store.get('view.sideBarWidth'));
      } else {
        setIsDistractionFree(true);
        setShowSideBar(false);
        setSideBarWidth(0);
      }
    });
    */
  });

  const changeView = (v: View) => {
    setView(v);
    switch (v) {
      case View.Regular:
        break;
      case View.PdfViewerOnly:
        setPdfWidth('100vw');
        break;
      case View.SideBarOnly:
        setSideBarWidth('100vw');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    setSideBarWidth(store.get('view.sideBarWidth'));
    setView(store.get('view.showSideBar') ? View.Regular : View.PdfViewerOnly);
  }, []);

  useEffect(() => {
    const setSize = () => {
      setHeight(window.innerHeight);
      setPdfWidth(window.innerWidth - sideBarWidth);
    };

    loadPapers();

    setSize();
    window.addEventListener('resize', throttle(setSize, 500));

    return () => {
      window.removeEventListener('resize', throttle(setSize, 500));
    };
  }, [sideBarWidth]);

  // store.onDidChange('view', ({ showSideBar, sideBarWidth }) => {
  //   console.log('Settings changed', showSideBar, sideBarWidth);
  //   setShowSideBar(showSideBar);
  //   setSideBarWidth(showSideBar ? sideBarWidth : 0);
  // });

  const removePaper = (p: Paper) => {
    p.remove();
    setShowPaperInfo(false);
    setSelectedPaper(null);
    loadPapers(); // TODO: avoid reloading all papers
  };

  return (
    <Flex column styles={{ height: '100vh', width: '100vw' }}>
      <Flex.Item grow>
        <Flex>
          {(view === View.Regular || view === View.SideBarOnly) && (
            <Box
              style={{
                width: view === View.Regular ? `${sideBarWidth}px` : '100vw',
                height: `${height}px`,
              }}
            >
              <PaperList
                expanded={view === View.SideBarOnly}
                allPapers={allPapers}
                onChange={(p) => setSelectedPaper(p)}
                onShowInfo={() => setShowPaperInfo(true)}
                onRemovePaper={(p) => removePaper(p)}
                onExpand={(val: boolean) =>
                  setView(val ? View.SideBarOnly : View.Regular)
                }
              />
            </Box>
          )}
          {(view === View.Regular || view === View.PdfViewerOnly) && (
            <Box
              style={{
                width: `calc(100vw - ${sideBarWidth}px`,
                height: `${height}px`,
              }}
            >
              {showPaperInfo ? (
                <PaperInfo
                  paper={selectedPaper}
                  onClose={() => setShowPaperInfo(false)}
                  onRemovePaper={(p) => removePaper(p)}
                />
              ) : (
                <PdfViewer
                  paper={selectedPaper}
                  width={pdfWidth}
                  addToLibrary={addToLibrary}
                />
              )}
            </Box>
          )}
        </Flex>
      </Flex.Item>
    </Flex>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/about" component={About} />
        <Route path="/preferences" component={Preferences} />
        <Route path="/" component={Main} />
      </Switch>
    </Router>
  );
}
