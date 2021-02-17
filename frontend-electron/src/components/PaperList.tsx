import React, { useState, useEffect } from 'react';
import { ButtonGroup, DownloadIcon, Flex, Input, Label, List, ListItemProps, SearchIcon, Text } from '@fluentui/react-northstar';
import {downloadPaper, getAuthorShort, getLocalPapers, searchArxiv} from '../utils/paper';
import {Paper} from '../types';
import {store} from '../utils/store';
require('format-unicorn')
import _ from 'lodash';
import { AiOutlineGlobal } from 'react-icons/ai'

;

type PaperListProps = {
  width: number;
  onChange: (paper: Paper) => void;
}

const Tag = ({ tag }: { tag: string }) => (
  <Label content={<Text size="small" content={tag.split(':').slice(-1)[0]} />}
    color="brand" />)

export default ({ width, onChange }: PaperListProps) => {
  enum ListType { None, Local, HashSearch, Search }

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [selectedList, setSelectedList] = useState<ListType>(ListType.None);
  const [localPapers, setLocalPapers] = useState<Paper[]>([]);

  const [listLocalPapers, setListLocalPapers] = useState<Paper[]>([]);
  const [listHashSearchPapers, setListHashSearchPapers] = useState<Paper[]>([]);
  const [listSearchPapers, setListSearchPapers] = useState<Paper[]>([]);

  const allLists = [
    {
      list: listLocalPapers,
      listType: ListType.Local,
      mapFn: (p: Paper) => ({
        key: p.id,
        header: getHeader(p),
        content: getContent(p),
        endMedia: getEndMedia(p)
      } as ListItemProps)
    },
    {
      list: listHashSearchPapers,
      listType: ListType.HashSearch,
      mapFn: (p: Paper) => ({
        key: p.id,
        header: getHeader(p),
        content: (<Flex gap="gap.smaller">
          {p.tags.map((tag) => (<Tag key={tag} tag={tag} />))}
        </Flex>)
      } as ListItemProps)
    },
    {
      list: listSearchPapers,
      listType: ListType.Search,
      mapFn: (p: Paper) => ({
        key: p.id,
        header: getHeader(p),
        content: getContent(p),
        contentMedia: <Text content='arvix' color="red" />,
        headerMedia: <AiOutlineGlobal />,
        endMedia: getEndMedia(p)
      } as ListItemProps)
    }
  ]

  const [searchQuery, setSearchQuery] = useState<string>('')

  const getHeader = ({ title }: Paper) => (
    (store.get('paperList.titleFormat') as string).formatUnicorn({
      title: title
    }));

  const getContent = ({ authors, year }: Paper) => (
    (store.get('paperList.descFormat') as string).formatUnicorn({
      authorShort: getAuthorShort(authors),
      year: year
    }));

  const getEndMedia = (paper: Paper) => (
    <ButtonGroup buttons={[
      {
        icon: <DownloadIcon />,
        iconOnly: true,
        text: true,
        title: "Download",
        key: "download",
        onClick: () => downloadPaper(paper)
      }
    ]} />);

  const loadLocalPapers = () => {
    setLocalPapers(getLocalPapers());
  }

  const refreshList = () => {
    console.log('refreshed')
    if (searchQuery == '') {
      setListLocalPapers(localPapers);
    } else if (searchQuery[0] == '#') {
      const hashTags = searchQuery.split(' ').map(s => s.length > 0 ? s.substring(1) : '').filter(s => s != '')
      console.log(hashTags);
      setListHashSearchPapers(localPapers
        .filter(it => hashTags.every(tag => it.tags.join(' ').indexOf(tag) >= 0)))
    } else {
      setListSearchPapers([])
      searchArxiv(searchQuery).then((items) => setListSearchPapers([...items]));
    }
  }

  useEffect(loadLocalPapers, []);
  useEffect(() => {
    if (!store.get('paperList.liveSearch')) return;
    const timer = setTimeout(() => {
      refreshList()
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery])
  useEffect(refreshList, [localPapers])

  return (
    <Flex fill column>
        <Input fluid
          icon={<SearchIcon />}
          value={searchQuery}
          placeholder="Input paper title or URL..."
          onChange={(_, props) => setSearchQuery(props!.value)}
          onKeyUp={(e) => { if (e.key == 'Enter') refreshList() }} />

      <div style={{ overflow: 'auto', height: 'calc(100vh - 120px)', width: width }}>
        { allLists.map(({ list, listType, mapFn }) => (
          list.length > 0 && <List selectable defaultSelectedIndex={-1}
            items={list.map(mapFn)}
            selectedIndex={selectedList == listType ? selectedIndex : -1}
              onSelectedIndexChange={(_, newProps) => {
                setSelectedIndex(newProps!.selectedIndex!);
                setSelectedList(listType);
                onChange(list[newProps!.selectedIndex!]);
                console.log(list[newProps!.selectedIndex!]) }
              }
              truncateHeader={true}
          />
        )) }
      </div>
    </Flex>
  );
}
