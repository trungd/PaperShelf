import React, { useState, useEffect } from 'react';
import {
  AcceptIcon,
  AddIcon,
  BookmarkIcon,
  Box,
  ButtonGroup,
  ButtonProps,
  Divider,
  DownloadIcon,
  EditIcon,
  Flex,
  Input,
  List,
  ListItemProps,
  SearchIcon,
  StarIcon,
  Text,
  Toolbar,
  ToolbarItemProps,
  TrashCanIcon,
} from '@fluentui/react-northstar';
import { AiOutlineGlobal } from 'react-icons/ai';
import { ipcRenderer } from 'electron';
import Fuse from 'fuse.js';
import Paper from '../utils/paper';
import { searchArxiv } from '../utils/arxiv';
import { store } from '../utils/store';
import Collection from '../utils/collection';
import CollectionToolbar from './CollectionToolbar';

require('format-unicorn');

type PaperListProps = {
  width: number;
  onChange: (paper: Paper) => void;
  onShowInfo: () => void;
  // eslint-disable-next-line react/require-default-props
  allPapers: Paper[];
  onRemovePaper: (paper: Paper) => void;
};

const PaperList = ({
  width,
  onChange,
  onShowInfo,
  allPapers,
  onRemovePaper,
}: PaperListProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [selectedPaper, setSelectedPaper] = useState<Paper>();
  const [collection, setCollection] = useState<Collection>();
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [items, setItems] = useState<ListItemProps[]>([]);

  const [menuOpenBookmark, setMenuOpenBookmark] = useState<boolean>(false);

  const setPaperList = (paperList: Paper[], searchMode: boolean) => {
    setPapers(paperList);

    const getInCollectionItems = () => {
      const inCollectionPapers = paperList.filter((p) =>
        p.inCollection(collection)
      );

      return [
        ...(collection && searchMode
          ? [
              {
                header: (
                  <Divider
                    content={`In Collection (${inCollectionPapers.length})`}
                  />
                ),
                styles: {
                  minHeight: 0,
                },
                selectable: false,
              },
            ]
          : []),
        ...inCollectionPapers.map((p) => mapFn(p, searchMode)),
      ];
    };

    const getOutCollectionItems = () => {
      if (!collection || !searchMode) return [];

      const outCollectionPapers = paperList.filter(
        (p) => !p.inCollection(collection)
      );
      return [
        {
          header: (
            <Divider content={`In Library (${outCollectionPapers.length})`} />
          ),
          styles: {
            minHeight: 0,
          },
          selectable: false,
        },
        ...outCollectionPapers.map((p) => mapFn(p, searchMode)),
      ];
    };

    const getWebSearchItems = () => {
      if (!searchMode) return [];
      const webSearchPapers = paperList.filter((p) => !p.inLibrary);
      return [
        {
          header: (
            <Divider content={`Search Results (${webSearchPapers.length})`} />
          ),
          styles: {
            minHeight: 0,
          },
          selectable: false,
        },
        ...webSearchPapers.map((p) => mapFn(p, searchMode)),
      ];
    };

    setItems([
      ...getInCollectionItems(),
      ...getOutCollectionItems(),
      ...getWebSearchItems(),
    ]);
  };

  const getHeader = ({ title }: Paper) =>
    (store.get('paperList.titleFormat') as string).formatUnicorn({
      title,
    });

  const getContent = ({ authorShort, year, venue }: Paper) =>
    (store.get('paperList.descFormat') as string).formatUnicorn({
      authorShort,
      year,
      venue,
    });

  const getEndMedia = (p: Paper, searchMode: boolean) => {
    const cond = (
      b: boolean,
      ifTrue: ButtonProps[],
      ifFalse: ButtonProps[] = []
    ) => (b ? ifTrue : ifFalse);

    return (
      <ButtonGroup
        buttons={
          [
            ...cond(p.inLibrary && !p.localPath && !searchMode, [
              {
                icon: <DownloadIcon />,
                iconOnly: true,
                text: true,
                onClick: () => {
                  p.download();
                  setPaperList(papers, searchMode);
                },
              },
            ]),
            ...cond(!p.inLibrary || !p.inCollection(collection), [
              {
                icon: <StarIcon />,
                iconOnly: true,
                text: true,
                onClick: () => {
                  if (!p.inLibrary) {
                    p.addToLibrary();
                    allPapers.push(p);
                  }
                  if (collection && !p.inCollection(collection)) {
                    p.addToCollection(collection);
                  }
                },
              },
            ]),
            ...cond(p.inLibrary && !searchMode, [
              {
                icon: <EditIcon />,
                iconOnly: true,
                text: true,
                onClick: () => onShowInfo(),
              },
            ]),
          ] as ButtonProps[]
        }
      />
    );
  };

  const getContentMedia = (p: Paper) => {
    if (p.inLibrary) {
      if (p.removed) return <Text content="Removed" color="red" />;
      return null;
    }
    return <Text content="arvix" color="red" />;
  };

  const mapFn = (p: Paper, searchMode: boolean) =>
    ({
      paper: p,
      header: getHeader(p),
      content: getContent(p),
      endMedia: getEndMedia(p, searchMode),
      contentMedia: getContentMedia(p),
      headerMedia: p.inLibrary ? null : <AiOutlineGlobal />,
      onContextMenu: () => {
        ipcRenderer.send('context', { itemType: 'paper', itemId: p.id });
      },
    } as ListItemProps);

  /* const mapFn = {
      content: (<Flex gap="gap.smaller">
        {p.tags.map((tag) => (
        <Tag key={tag} tag={tag} />
        ))}
      </Flex>),
    } as ListItemProps),
  } */

  const refreshList = (currentQuery: string, search = false) => {
    // const papersInCollection = collection
    //   ? allPapers.filter((p) => collection.papers.includes(p.id!))
    //   : allPapers;

    if (currentQuery === '') {
      setPaperList(allPapers, false);
    } else if (currentQuery[0] === '#') {
      const hashTags = searchQuery
        .split(' ')
        .map((s) => (s.length > 0 ? s.substring(1) : ''))
        .filter((s) => s !== '');
      setPaperList(
        allPapers.filter((it) =>
          hashTags.every((tag) => [...it.tags].join(' ').indexOf(tag) >= 0)
        ),
        true
      );
    } else {
      const searchResults: Paper[] = [];

      const updateResults = (resPapers: Paper[]) => {
        searchResults.push(
          ...resPapers.filter(
            (p) => !searchResults.map((rp) => rp.id).includes(p.id)
          )
        );
        setPaperList(searchResults, true);
      };

      if (search) {
        Promise.all([
          searchArxiv(currentQuery).then((res) =>
            updateResults(
              res.map((arxivPaper) => new Paper().fromArxivPaper(arxivPaper))
            )
          ),
        ]).catch(() => {});
      } else {
        const fuse = new Fuse(allPapers, {
          keys: store.get('searchFields'),
          threshold: store.get('searchThreshold'),
        });
        setPaperList(
          fuse.search(currentQuery).map((e) => e.item),
          true
        );
      }
    }
  };

  const onSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    refreshList(query);
  };

  useEffect(() => refreshList(searchQuery), [collection, allPapers]);

  return (
    <Flex fill column>
      <CollectionToolbar
        onChangeCollection={(c) => setCollection(c)}
        allCollections={allCollections}
        setAllCollections={setAllCollections}
      />
      <Input
        fluid
        icon={<SearchIcon />}
        value={searchQuery}
        placeholder="Input paper title or URL..."
        onChange={(_, props) => onSearchQueryChange(props!.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') refreshList(searchQuery, true);
        }}
        clearable
      />

      <Box
        styles={{
          overflow: 'auto',
          width: `${width}px`,
          position: 'relative',
          height: `calc(100% - 96px)`,
        }}
      >
        <List
          selectable
          truncateHeader
          truncateContent
          defaultSelectedIndex={-1}
          items={items}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={(_, p) => {
            setSelectedIndex(p?.selectedIndex);
            const paper =
              p?.selectedIndex !== undefined
                ? items[p?.selectedIndex].paper
                : undefined;
            setSelectedPaper(paper);
            if (p?.selectedIndex !== undefined) {
              onChange(paper);
              console.log(paper);
            }
          }}
        />
      </Box>

      <Toolbar
        items={
          [
            {
              key: 'collection',
              icon: <BookmarkIcon />,
              title: 'Add to Collection',
              menu: allCollections.map((c) => ({
                key: c.key,
                content: c.name,
                icon: selectedPaper?.inCollection(c) ? (
                  <AcceptIcon />
                ) : (
                  <AddIcon />
                ),
                onClick: () => {
                  if (selectedPaper) {
                    c.toggle(selectedPaper.id!);
                  }
                },
              })),
              menuOpen: menuOpenBookmark,
              onMenuOpenChange: (_, p) => setMenuOpenBookmark(p?.menuOpen),
              disabled:
                selectedIndex === undefined || !selectedPaper?.inLibrary,
            },
            {
              icon: <DownloadIcon />,
              title: 'Download',
              disabled: !selectedPaper?.inLibrary || selectedPaper?.localPath,
              onClick: () => selectedPaper?.download(),
            },
            {
              kind: 'divider',
            },
            {
              icon: <TrashCanIcon />,
              title: 'Remove from Library',
              disabled: !selectedPaper || !selectedPaper?.inLibrary,
              onClick: () => onRemovePaper(selectedPaper!),
            },
          ] as ToolbarItemProps[]
        }
      />
    </Flex>
  );
};

export default PaperList;
