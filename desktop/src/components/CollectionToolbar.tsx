import {
  AddIcon,
  BookmarkIcon,
  Button,
  ButtonProps,
  Form,
  Input,
  MenuItemProps,
  Toolbar,
  TrashCanIcon,
  Text,
  MenuIcon,
  ToolbarMenuItemProps,
  ToolbarItemProps,
  StarIcon,
} from '@fluentui/react-northstar';
import React, { useEffect, useState } from 'react';
import { BiHide } from 'react-icons/bi';
import { GiBookshelf } from 'react-icons/gi';
import Collection, { getCollections } from '../utils/collection';

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

type CollectionToolbarProps = {
  onChangeCollection: (c: Collection) => void;
  allCollections: Collection[];
  setAllCollections: (cs: Collection[]) => void;
};

const CollectionToolbar = ({
  onChangeCollection,
  allCollections,
  setAllCollections,
}: CollectionToolbarProps) => {
  const [collection, setCollection] = useState<Collection>();
  const [menuOpenCollections, setMenuOpenCollections] = useState<boolean>();
  const [menuOpenNewCollection, setMenuOpenNewCollection] = useState<boolean>(
    false
  );

  useEffect(() => setAllCollections(getCollections()), []);

  const changeCollection = (c: Collection) => {
    setCollection(c);
    onChangeCollection(c);
  };

  const collectionsMoreMenu = [
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
                icon: c.getIcon(),
                onClick: () => {
                  c.show = true;
                  c.serialize();
                  changeCollection(c);
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
          changeCollection(undefined);
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
        changeCollection(undefined);
      },
    },
  ];

  const collectionsMenu = [
    {
      key: 'all',
      icon: <GiBookshelf />,
      text: true,
      content: 'All',
      primary: collection === undefined,
      size: 'small',
      onClick: () => changeCollection(undefined),
    },
    { key: 'divider-1', kind: 'divider' },
    ...allCollections
      .filter((c) => c.show)
      .map(
        (c) =>
          ({
            key: c.key,
            text: true,
            content: c.name,
            size: 'small',
            icon: c.getIcon(),
            primary: collection?.key === c.key,
            onClick: () => changeCollection(c),
          } as ButtonProps)
      ),
    { key: 'divider-2', kind: 'divider' },
    {
      key: 'more',
      text: true,
      content: 'More...',
      menu: collectionsMoreMenu,
    },
  ] as ToolbarMenuItemProps[];

  const toolbarItems = [
    {
      key: 'collections',
      icon: <MenuIcon />,
      menu: collectionsMenu,
      menuOpen: menuOpenCollections,
      onMenuOpenChange: (_, p) => setMenuOpenCollections(p?.menuOpen),
    },
    {
      key: 'custom',
      kind: 'custom',
      content: (
        <Text
          content={collection?.name || 'All'}
          styles={{ color: 'brand', width: '100%' }}
          truncated
        />
      ),
    },
  ] as ToolbarItemProps[];

  return <Toolbar aria-label="Default" items={toolbarItems} />;
};

export default CollectionToolbar;
