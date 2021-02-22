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
import Collection, { getCollections } from './utils/collection';
import About from './views/about';

const Main = () => {
  const [sideBarWidth, setSideBarWidth] = useState<number>(300);
  const [showPaperInfo, setShowPaperInfo] = useState<boolean>(false);
  const [showSideBar, setShowSideBar] = useState<boolean>(true);
  const [pdfWidth, setPdfWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);

  const loadPapers = () => setAllPapers(getLocalPapers());

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

  useEffect(() => {
    const setSize = () => {
      setHeight(window.innerHeight);
      setPdfWidth(window.innerWidth - sideBarWidth);
    };

    loadPapers();

    setSize();
    window.addEventListener('resize', throttle(setSize, 500));

    setShowSideBar(store.get('view.showSideBar'));
    setSideBarWidth(
      store.get('view.showSideBar') ? store.get('view.sideBarWidth') : 0
    );

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
    setSelectedPaper(undefined);
    loadPapers();
  };

  return (
    <Flex column styles={{ height: '100vh', width: '100vw' }}>
      <Flex.Item grow>
        <Flex>
          {showSideBar && (
            <Box style={{ width: `${sideBarWidth}px`, height: `${height}px` }}>
              <PaperList
                allPapers={allPapers}
                width={sideBarWidth}
                onChange={(paper) => setSelectedPaper(paper)}
                onShowInfo={() => setShowPaperInfo(true)}
                onRemovePaper={(p) => removePaper(p)}
              />
            </Box>
          )}
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
              <PdfViewer paper={selectedPaper} width={pdfWidth} />
            )}
          </Box>
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
        <Route path="/" component={Main} />
      </Switch>
    </Router>
  );
}
