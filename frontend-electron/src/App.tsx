import { throttle } from 'lodash';
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import {
  Flex,
  Toolbar,
  AddIcon,
  Box,
  Button,
  ButtonProps,
  Input,
  Form,
  TrashCanIcon,
  BookmarkIcon,
  MenuItemProps,
} from '@fluentui/react-northstar';
import { GiBookshelf } from 'react-icons/gi';
import { BiAddToQueue, BiHide } from 'react-icons/bi';
import PdfViewer from './components/PdfViewer';
import PaperList from './components/PaperList';
import './App.global.css';

import PaperInfo from './components/PaperInfo';
import Paper, { getLocalPapers } from './utils/paper';
import { store } from './utils/store';
import Collection, { getCollections } from './utils/collection';
import About from './views/about';
import { onToggleDistractionFreeMode } from './utils/broadcast';

const NewCollectionPopup = ({ onAdd }: { onAdd: (name: string) => void }) => {
  const [name, setName] = useState<string>();

  return (
    <Form
      fields={[
        {
          label: 'name',
          required: true,
          inline: true,
          control: {
            as: Input,
            value: name,
            onChange: (_, p) => setName(p?.value),
            showSuccessIndicator: false,
          },
        },
        {
          control: {
            as: Button,
            content: 'Add',
            onClick: () => onAdd(name),
          },
        },
      ]}
    />
  );
};

const Main = () => {
  const [isDistractionFree, setIsDistractionFree] = useState<boolean>(false);
  const [sideBarWidth, setSideBarWidth] = useState<number>(300);
  const [showPaperInfo, setShowPaperInfo] = useState<boolean>(false);
  const [showSideBar, setShowSideBar] = useState<boolean>(true);
  const [pdfWidth, setPdfWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  const [menuOpenNewCollection, setMenuOpenNewCollection] = useState<boolean>(
    false
  );

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [collection, setCollection] = useState<Collection>();

  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [allPapers, setAllPapers] = useState<Papers[]>([]);

  const [addTab, setAddTab] = useState<boolean>();

  const loadCollections = () => setAllCollections(getCollections());

  useEffect(() => {
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
  });

  useEffect(() => {
    const setSize = () => {
      setHeight(window.innerHeight - 32);
      setPdfWidth(window.innerWidth - sideBarWidth);
    };

    loadCollections();
    setAllPapers(getLocalPapers());

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

  return (
    <Flex column styles={{ height: '100vh', width: '100vw' }}>
      <Toolbar
        aria-label="Default"
        items={[
          {
            kind: 'custom',
            content: (
              <Button.Group
                buttons={[
                  {
                    key: 'all',
                    icon: <GiBookshelf />,
                    text: true,
                    content: 'All',
                    primary: collection === undefined,
                    size: 'small',
                    onClick: () => setCollection(undefined),
                  },
                  ...allCollections
                    .filter((c) => c.show)
                    .map(
                      (c) =>
                        ({
                          key: c.key,
                          text: true,
                          content: c.name,
                          size: 'small',
                          primary: collection?.key === c.key,
                          onClick: () => setCollection(c),
                        } as ButtonProps)
                    ),
                ]}
              />
            ),
          },
          {
            icon: <BiAddToQueue />,
            key: 'add-tab',
            active: addTab,
            menu: [
              {
                key: 'new-collection',
                content: 'New Collection',
                icon: <BookmarkIcon />,
                active: menuOpenNewCollection,
                popup: (
                  <NewCollectionPopup
                    onAdd={(name: string) => {
                      setMenuOpenNewCollection(false);
                      if (name) {
                        setAllCollections([
                          ...allCollections,
                          new Collection({
                            name,
                            key: name.toLowerCase().replace(/\W/g, '-'),
                          }).serialize(),
                        ]);
                      }
                    }}
                  />
                ),
                menuOpen: menuOpenNewCollection,
                onMenuOpenChange: (_, { menuOpen }) => {
                  setMenuOpenNewCollection(menuOpen);
                },
              },
              { key: 'divider-1', kind: 'divider' },
              ...((arr: MenuItemProps[]) => {
                return arr.length > 0
                  ? [...arr, { key: 'divider-2', kind: 'divider' }]
                  : [];
              }) // apppend 'divider' if length > 0
                .call(
                  null,
                  allCollections
                    .filter((c) => !c.show)
                    .map(
                      (c) =>
                        ({
                          key: `open-${c.name}`,
                          content: c.name,
                          icon: <AddIcon />,
                          onClick: () => {
                            c.show = true;
                            c.serialize();
                            setCollection(c);
                          },
                        } as MenuItemProps)
                    )
                ),
              {
                key: 'hide-collection',
                content: 'Hide Collection',
                disabled: collection === undefined,
                icon: <BiHide />,
                onClick: () => {
                  if (collection) {
                    collection.show = false;
                    collection.serialize();
                    setCollection(undefined);
                  }
                },
              },
              {
                key: 'remove-collection',
                content: 'Delete Collection',
                disabled: collection === undefined,
                icon: <TrashCanIcon />,
                onClick: () => {
                  collection?.delete();
                  setCollection(undefined);
                  loadCollections();
                },
              },
            ],
            menuOpen: addTab,
            onMenuOpenChange: (_, p) => setAddTab(p?.menuOpen),
          },
        ]}
      />
      <Flex.Item grow>
        <Flex>
          {showSideBar && (
            <Box style={{ width: `${sideBarWidth}px`, height: `${height}px` }}>
              <PaperList
                collection={collection}
                allCollections={allCollections}
                allPapers={allPapers}
                width={sideBarWidth}
                onChange={(paper) => setSelectedPaper(paper)}
                onShowInfo={() => setShowPaperInfo(true)}
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
              />
            ) : (
              <PdfViewer
                paper={selectedPaper}
                width={pdfWidth}
                collections={allCollections}
              />
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
