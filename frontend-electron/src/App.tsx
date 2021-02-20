import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Flex, Toolbar, AddIcon, Menu, Box } from '@fluentui/react-northstar';
import { GiBookshelf } from 'react-icons/gi';
import { AiFillFolderAdd, AiFillTag } from 'react-icons/ai';
import PdfViewer from './components/PdfViewer';
import PaperList from './components/PaperList';
import './App.global.css';

import AddPaper from './views/addPaper';
import Paper from './utils/paper';
import { store } from './utils/store';
import Collection, { getCollections } from './utils/collection';

const Main = () => {
  const [sideBarWidth, setSideBarWidth] = useState<number>(300);
  const [showSideBar, setShowSideBar] = useState<boolean>(true);
  const [pdfWidth, setPdfWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [selectedPaper, setSelectedPaper] = useState<Paper>();
  const [collection, setCollection] = useState<Collection>();
  const [allCollections, setAllCollections] = useState<Collection[]>([]);

  const [addTab, setAddTab] = useState<boolean>(false);

  const setSize = () => {
    setHeight(window.innerHeight - 32);
    setPdfWidth(window.innerWidth - sideBarWidth);
  };

  useEffect(() => {
    setAllCollections(getCollections());

    setSize();
    window.addEventListener('resize', _.throttle(setSize, 500));

    setShowSideBar(store.get('view.showSideBar'));
    setSideBarWidth(
      store.get('view.showSideBar') ? store.get('view.sideBarWidth') : 0
    );

    return () => {
      window.removeEventListener('resize', _.throttle(setSize, 500));
    };
  }, []);

  const onSetCollection = (c: Collection) => {
    setCollection(c);
  };

  // store.onDidChange('view', ({ showSideBar, sideBarWidth }) => {
  //   console.log('Settings changed', showSideBar, sideBarWidth);
  //   setShowSideBar(showSideBar);
  //   setSideBarWidth(showSideBar ? sideBarWidth : 0);
  // });

  return (
    <Flex column styles={{ height: '100vh', width: '100vw' }}>
      <Toolbar
        aria-label="Default"
        items={[
          {
            key: 'collection',
            kind: 'custom',
            content: (
              <Menu
                underlined
                primary
                items={[
                  {
                    key: 'all',
                    icon: <GiBookshelf />,
                    content: 'All',
                    active: !collection,
                    onClick: () => setCollection(undefined),
                  },
                  ...allCollections!.map((c) => ({
                    key: c.key,
                    content: c.name,
                    active: collection?.key === c.key,
                    onClick: () => onSetCollection(c),
                  })),
                ]}
              />
            ),
          },
          {
            icon: (
              <AddIcon
                {...{
                  outline: true,
                }}
              />
            ),
            key: 'add-tab',
            active: addTab,
            menu: [
              {
                key: 'new-collection',
                content: 'New Collection',
                icon: <AiFillFolderAdd />,
              },
              {
                key: 'open-tag',
                content: 'Open Tag',
                icon: <AiFillTag />,
              },
            ],
            menuOpen: addTab,
            onMenuOpenChange: (_, { menuOpen }) => setAddTab(menuOpen),
          },
        ]}
      />
      <Flex.Item grow>
        <Flex>
          {showSideBar && (
            <Box style={{ width: `${sideBarWidth}px`, height: `${height}px` }}>
              <PaperList
                collection={collection}
                width={sideBarWidth}
                onChange={(paper) => setSelectedPaper(paper)}
              />
            </Box>
          )}
          <Box
            style={{
              width: `calc(100vw - ${sideBarWidth}px`,
              height: `${height}px`,
            }}
          >
            <PdfViewer paper={selectedPaper} width={pdfWidth} />
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
        <Route path="/addPaper" component={AddPaper} />
        <Route path="/" component={Main} />
      </Switch>
    </Router>
  );
}
