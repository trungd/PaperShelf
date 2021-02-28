import {
  AcceptIcon,
  AppsIcon,
  ArrowSortIcon,
  CalendarIcon,
  FontSizeIcon,
  QuoteIcon,
  Toolbar,
} from '@fluentui/react-northstar';
import { getByTitle } from '@testing-library/react';
import React, { useState } from 'react';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';

export enum SortType {
  ByTitle = 'title',
  ByYear = 'year',
  ByCitation = 'citation',
  ByDateAdded = 'dateAdded',
  ByDateModified = 'dateModified',
}

type InCollectionToolbarProps = {
  sort: SortType;
  onSort: (sort: SortType) => void;
  expanded: boolean;
  onExpand: (e: boolean) => void;
};

const InCollectionToolbar = ({
  sort,
  onSort,
  expanded,
  onExpand,
}: InCollectionToolbarProps) => {
  const [sortMenuOpen, setSortMenuOpen] = useState<boolean>(false);
  return (
    <Toolbar
      items={[
        {
          key: 'sort',
          icon: <ArrowSortIcon />,
          menu: [
            {
              key: 'byDateAdded',
              content: 'By Added Date',
              icon: sort === SortType.ByDateAdded ? <AcceptIcon /> : null,
              onClick: () => onSort(SortType.ByDateAdded),
              selected: sort === SortType.ByDateAdded,
            },
            {
              key: 'byDateModified',
              content: 'By Modified Date',
              icon: sort === SortType.ByDateModified ? <AcceptIcon /> : null,
              onClick: () => onSort(SortType.ByDateModified),
            },
            {
              key: 'byYear',
              content: 'By Published Year',
              icon: sort === SortType.ByYear ? <AcceptIcon /> : null,
              onClick: () => onSort(SortType.ByYear),
            },
            {
              key: 'byCitation',
              content: 'By Citation',
              icon: sort === SortType.ByCitation ? <AcceptIcon /> : null,
              onClick: () => onSort(SortType.ByCitation),
            },
            {
              key: 'byTitle',
              content: 'By Title',
              icon: sort === SortType.ByTitle ? <AcceptIcon /> : null,
              onClick: () => onSort(SortType.ByTitle),
            },
          ],
          active: sortMenuOpen,
          menuOpen: sortMenuOpen,
          onMenuOpenChange: (_, p) => setSortMenuOpen(p?.menuOpen),
        },
        // {
        //  key: 'source',
        //  icon: <AppsIcon />,
        // },
        {
          key: 'expand',
          icon: expanded ? <FiMinimize2 /> : <FiMaximize2 />,
          onClick: () => onExpand(!expanded),
        },
      ]}
    />
  );
};

export default InCollectionToolbar;
