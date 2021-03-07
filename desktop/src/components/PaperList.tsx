import React, { useState, useEffect } from 'react';
import {
  AddIcon,
  BookmarkIcon,
  Box,
  ButtonGroup,
  ButtonProps,
  Divider,
  DownloadIcon,
  EditIcon,
  Flex,
  Image,
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
import {
  AiFillCloud,
  AiFillDelete,
  AiFillStar,
  AiOutlineStar,
} from 'react-icons/ai';
import { ipcRenderer } from 'electron';
import Fuse from 'fuse.js';
import Paper, { searchPaper } from '../utils/paper';
import { store } from '../utils/store';
import Collection from '../utils/collection';
import CollectionToolbar from './CollectionToolbar';
import InCollectionToolbar, { SortType } from './InCollectionToolbar';

require('format-unicorn');

type PaperListProps = {
  expanded: boolean;
  onChange: (paper: Paper) => void;
  onShowInfo: () => void;
  // eslint-disable-next-line react/require-default-props
  allPapers: Paper[];
  onRemovePaper: (paper: Paper) => void;
  onExpand: (val: boolean) => void;
};

const PaperList = ({
  expanded,
  onChange,
  onShowInfo,
  allPapers,
  onRemovePaper,
  onExpand,
}: PaperListProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [selectedPaper, setSelectedPaper] = useState<Paper>();
  const [collection, setCollection] = useState<Collection>();
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchMode, setSearchMode] = useState<boolean>(true);
  const [sortType, setSortType] = useState<SortType>(SortType.ByDateAdded);

  const [menuOpenBookmark, setMenuOpenBookmark] = useState<boolean>(false);

  useEffect(() => {
    setSortType(store.get('defaultSortBy'));
  }, []);

  const sort = (paperList: Paper[]) => {
    switch (sortType) {
      case SortType.ByDateAdded:
        return paperList.sort((a: Paper, b: Paper) =>
          a.dateAdded && b.dateAdded
            ? -a.dateAdded!.getTime() + b.dateAdded!.getTime()
            : 1
        );
      case SortType.ByDateModified:
        return paperList.sort((a: Paper, b: Paper) =>
          a.dateModified && b.dateModified
            ? -a.dateModified!.getTime() + b.dateModified!.getTime()
            : 1
        );
      case SortType.ByYear:
        return paperList.sort((a: Paper, b: Paper) =>
          a.year && b.year ? -a.year.localeCompare(b.year) : 1
        );
      case SortType.ByCitation:
        return paperList.sort((a: Paper, b: Paper) =>
          a.numCitations && b.numCitations
            ? -a.numCitations + b.numCitations
            : 1
        );
      case SortType.ByTitle:
        return paperList.sort((a: Paper, b: Paper) =>
          a.title && b.title ? a.title.localeCompare(b.title) : 1
        );
      default:
        return paperList;
    }
  };

  const getListItems = () => {
    const getInCollectionItems = () => {
      const inCollectionPapers = sort(
        papers.filter((p) => p.inCollection(collection))
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
        ...inCollectionPapers.map((p) => mapFn(p)),
      ];
    };

    const getOutCollectionItems = () => {
      if (!collection || !searchMode) return [];

      const outCollectionPapers = sort(
        papers.filter((p) => !p.inCollection(collection))
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
        ...outCollectionPapers.map((p) => mapFn(p)),
      ];
    };

    const getWebSearchItems = () => {
      if (!searchMode) return [];
      const sources = store.get('searchPaperSources') as string[];
      return sources
        .map((source) => {
          const webSearchPapers = sort(papers.filter((p) => p.sources[source]));
          return [
            {
              header: (
                <Divider content={`${source} (${webSearchPapers.length})`} />
              ),
              styles: {
                minHeight: 0,
              },
              selectable: false,
            },
            ...webSearchPapers.map((p) => mapFn(p)),
            // {
            //   header: (
            //     <Flex>
            //       <Button
            //         size="small"
            //         text
            //         content={`More from ${source}...`}
            //         fluid
            //       />
            //     </Flex>
            //   ),
            //   styles: {
            //     minHeight: 0,
            //   },
            //   selectable: false,
            // },
          ];
        })
        .flat(1);
    };

    return [
      ...getInCollectionItems(),
      ...getOutCollectionItems(),
      ...getWebSearchItems(),
    ];
  };

  const getHeader = (p: Paper) => (
    <Text>
      {((expanded
        ? store.get('paperList.expandedHeaderFormat')
        : store.get('paperList.headerFormat')) as string).formatUnicorn(p)}
    </Text>
  );

  const getContent = (p: Paper) => (
    <Text>
      {((expanded
        ? store.get('paperList.expandedContentFormat')
        : store.get('paperList.contentFormat')) as string).formatUnicorn(p)}
    </Text>
  );

  const getEndMedia = (p: Paper) => {
    const cond = (
      b: boolean,
      ifTrue: ButtonProps[],
      ifFalse: ButtonProps[] = []
    ) => (b ? ifTrue : ifFalse);

    return (
      <ButtonGroup
        buttons={
          [
            ...cond(!p.inLibrary || !p.inCollection(collection), [
              {
                icon: p.starred ? <AddIcon /> : <AiOutlineStar />,
                iconOnly: true,
                text: true,
                onClick: () => {
                  if (!p.inLibrary) {
                    p.addToLibrary();
                    allPapers.push(p);
                    setPapers(papers);
                  }
                  if (collection && !p.inCollection(collection)) {
                    p.addToCollection(collection);
                  }
                },
              },
            ]),
            ...cond(p.inLibrary && !searchMode, [
              {
                icon: p.starred ? <StarIcon /> : <StarIcon />,
                iconOnly: true,
                text: true,
                onClick: () => {
                  p.toggleStar();
                },
              },
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

  const getHeaderMedia = (p: Paper) => {
    return (
      <Flex>
        {p.removed && <AiFillDelete />}
        {p.starred && <AiFillStar />}
        {!p.localPath && <AiFillCloud />}
      </Flex>
    );

    return <Text content="arvix" color="red" />;
  };

  const getContentMedia = (p: Paper) => {
    return (
      <Flex>
        {p.inLibrary && !p.read && <Text content="New!" color="red" />}
      </Flex>
    );
  };

  const mapFn = (p: Paper) =>
    ({
      paper: p,
      header: getHeader(p),
      headerMedia: getHeaderMedia(p),
      content: getContent(p),
      endMedia: getEndMedia(p),
      // important: p.starred,
      contentMedia: getContentMedia(p),
      media: expanded && (
        <Image src={p.thumbnail} styles={{ height: '200px' }} />
      ),
      onContextMenu: () => {
        ipcRenderer.send('context', { itemType: 'paper', itemId: p.id });
      },
      styles: {
        paddingTop: '8px',
        paddingBottom: '8px',
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
      setPapers(allPapers);
      setSearchMode(false);
    } else if (currentQuery[0] === '#') {
      const hashTags = searchQuery
        .split(' ')
        .map((s) => (s.length > 0 ? s.substring(1) : ''))
        .filter((s) => s !== '');
      setPapers(
        allPapers.filter((it) =>
          hashTags.every((tag) => [...it.tags].join(' ').indexOf(tag) >= 0)
        )
      );
      setSearchMode(true);
    } else {
      const searchResults: Paper[] = [];

      const updateResults = (resPapers: Paper[]) => {
        searchResults.push(
          ...resPapers.filter(
            (p) => !searchResults.map((rp) => rp.id).includes(p.id)
          )
        );
        setPapers(searchResults);
        setSearchMode(true);
      };

      if (search) {
        searchPaper(currentQuery, updateResults);
      } else {
        const fuse = new Fuse(allPapers, {
          keys: store.get('searchFields'),
          threshold: store.get('searchThreshold'),
        });
        setPapers(fuse.search(currentQuery).map((e) => e.item));
        setSearchMode(true);
      }
    }
  };

  const onSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    refreshList(query);
  };

  useEffect(() => refreshList(searchQuery), [collection, allPapers]);

  const toolbarItems = [
    {
      key: 'collection',
      icon: <BookmarkIcon />,
      title: 'Add to Collection',
      menu: allCollections.map((c) => ({
        key: c.key,
        content: (
          <Text content={c.name} important={selectedPaper?.inCollection(c)} />
        ),
        icon: c.getIcon(),
        onClick: () => {
          if (selectedPaper) {
            c.toggle(selectedPaper.id!);
          }
        },
      })),
      menuOpen: menuOpenBookmark,
      onMenuOpenChange: (_, p) => setMenuOpenBookmark(p?.menuOpen),
      disabled: selectedIndex === undefined || !selectedPaper?.inLibrary,
    },
    {
      key: 'download',
      icon: <DownloadIcon />,
      title: 'Download',
      disabled:
        !selectedPaper?.inLibrary || selectedPaper?.localPath !== undefined,
      onClick: () => selectedPaper?.download(),
    },
    {
      key: 'divider-1',
      kind: 'divider',
    },
    {
      key: 'remove',
      icon: <TrashCanIcon />,
      title: 'Remove from Library',
      disabled: !selectedPaper || !selectedPaper?.inLibrary,
      onClick: () => onRemovePaper(selectedPaper!),
    },
  ] as ToolbarItemProps[];

  return (
    <Flex fill column style={{ userSelect: 'none' }}>
      <Flex>
        <Flex.Item grow>
          <CollectionToolbar
            onChangeCollection={(c) => setCollection(c)}
            allCollections={allCollections}
            setAllCollections={setAllCollections}
          />
        </Flex.Item>
        <Flex.Item>
          <InCollectionToolbar
            expanded={expanded}
            onExpand={onExpand}
            sort={sortType}
            onSort={setSortType}
          />
        </Flex.Item>
      </Flex>
      <Flex>
        <Flex.Item grow>
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
        </Flex.Item>
      </Flex>

      <Box
        styles={{
          overflow: 'auto',
          width: `100%`,
          position: 'relative',
          height: `calc(100% - 96px)`,
        }}
      >
        <List
          selectable
          truncateHeader
          truncateContent={!expanded}
          defaultSelectedIndex={-1}
          items={getListItems()}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={(_, p) => {
            setSelectedIndex(p?.selectedIndex);

            const paper: Paper | undefined =
              p?.selectedIndex !== undefined
                ? getListItems()[p?.selectedIndex].paper
                : undefined;

            if (paper) {
              paper.loadCache();
              if (paper.inLibrary) {
                paper.read = true;
                if (!paper.dateFetched) {
                  paper.fetch();
                } else {
                  paper.serialize();
                }
              }
              setSelectedPaper(paper);
              onChange(paper);
            }
          }}
        />
      </Box>

      <Toolbar items={toolbarItems} />
    </Flex>
  );
};

export default PaperList;
