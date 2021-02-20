import React, { useState, useEffect } from 'react';
import {
  Box,
  ButtonGroup,
  DownloadIcon,
  EditIcon,
  Flex,
  Input,
  List,
  ListItemProps,
  SearchIcon,
  StarIcon,
  Text,
} from '@fluentui/react-northstar';
import { AiOutlineGlobal } from 'react-icons/ai';
import { ipcRenderer } from 'electron';
import Paper, { getLocalPapers, getPaper, searchArxiv } from '../utils/paper';
import { store } from '../utils/store';
import { openModalEditPaper } from '../utils/broadcast';
import Collection from '../utils/collection';

require('format-unicorn');

type PaperListProps = {
  width: number;
  onChange: (paper: Paper) => void;
  collection: Collection;
};

const PaperList = ({ width, onChange, collection }: PaperListProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [localPapers, setLocalPapers] = useState<Paper[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [papers, setPapers] = useState<Paper[]>([]);

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

  const getEndMedia = (p: Paper) => (
    <ButtonGroup
      buttons={[
        ...(!p.localPath
          ? [
              {
                icon: <DownloadIcon />,
                iconOnly: true,
                text: true,
                title: 'Download',
                key: 'download',
                onClick: () => p.download(),
              },
            ]
          : []),
        ...(!p.inLibrary
          ? [
              {
                icon: <StarIcon />,
                iconOnly: true,
                text: true,
                title: 'Add to Library',
                key: 'add-to-library',
                onClick: () => p.addToLibrary(),
              },
            ]
          : [
              {
                icon: <EditIcon />,
                iconOnly: true,
                text: true,
                title: 'Edit',
                key: 'edit',
                onClick: () => openModalEditPaper(p),
              },
            ]),
      ]}
    />
  );

  const mapFn = (p: Paper) =>
    ({
      key: p.id,
      header: getHeader(p),
      content: getContent(p),
      endMedia: getEndMedia(p),
      contentMedia: p.inLibrary ? null : <Text content="arvix" color="red" />,
      headerMedia: p.inLibrary ? null : <AiOutlineGlobal />,
      onContextMenu: () => {
        console.log('renderer-context-menu');
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

  const refreshList = () => {
    if (searchQuery === '') {
      setPapers(localPapers);
    } else if (searchQuery[0] === '#') {
      const hashTags = searchQuery
        .split(' ')
        .map((s) => (s.length > 0 ? s.substring(1) : ''))
        .filter((s) => s !== '');
      console.log('Hash Tags: ', hashTags);
      setPapers(
        localPapers.filter((it) =>
          hashTags.every((tag) => [...it.tags].join(' ').indexOf(tag) >= 0)
        )
      );
    } else {
      setPapers([]);
      searchArxiv(searchQuery)
        .then((items) =>
          items.map((arxivPaper) => new Paper().fromArxivPaper(arxivPaper))
        )
        .catch((err) => console.log(err));
    }
  };

  useEffect(() => {
    if (searchQuery === '') {
      refreshList();
      return;
    }
    if (!store.get('paperList.liveSearch')) return;
    refreshList();
    // TODO: debouncing
    // return () => { clearTimeout(timer); };
  }, [searchQuery]);
  useEffect(refreshList, [localPapers]);
  useEffect(() => {
    if (collection) {
      setLocalPapers(collection.papers.map((key) => getPaper(key)!));
    } else {
      setLocalPapers(getLocalPapers());
    }
  }, [collection]);

  return (
    <Flex fill column>
      <Input
        fluid
        icon={<SearchIcon />}
        value={searchQuery}
        placeholder="Input paper title or URL..."
        onChange={(_, props) => setSearchQuery(props!.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') refreshList();
        }}
        clearable
      />

      <Box
        styles={{
          overflow: 'auto',
          width: `${width}px`,
          position: 'relative',
          height: `calc(100% - 32px)`,
        }}
      >
        <List
          selectable
          truncateHeader
          truncateContent
          defaultSelectedIndex={-1}
          items={papers.map(mapFn)}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={(_, newProps) => {
            setSelectedIndex(newProps!.selectedIndex!);
            onChange(papers[newProps!.selectedIndex!]);
            console.log('Selected: ', papers[newProps!.selectedIndex!]);
          }}
        />
      </Box>
    </Flex>
  );
};

export default PaperList;
