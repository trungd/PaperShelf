import React, { ReactElement, useEffect, useState } from 'react';
import {
  Flex,
  Header,
  Segment,
  Button,
  FormInput,
  FormDropdown,
  Box,
  Divider,
  Text,
  RadioGroup,
} from '@fluentui/react-northstar';
import { remote, shell } from 'electron';
import { changeDataStoreCwd, store } from '../utils/store';
import { getAuthUrl } from '../utils/sync/google-drive/sync';
import { Sources } from '../utils/sources';
import '../App.global.css';

const Section = ({
  title,
  items,
  content,
  desc,
}: {
  title: string;
  items?: any[];
  content?: ReactElement;
  desc?: string;
}) => (
  <Box>
    <Segment color="brand">
      <Header as="h3" content={title} />
      {items ? (
        <Flex column gap="gap.small">
          {desc && <Text temporary content={desc} size="small" />}
          {items}
        </Flex>
      ) : (
        content
      )}
    </Segment>
  </Box>
);

export default function Preferences() {
  const [syncGoogleDriveCode, setSyncGoogleDriveCode] = useState<string>();
  const [syncMethod, setSyncMethod] = useState<string>();
  const [dataLocation, setDataLocation] = useState<string>();
  const [paperLocation, setPaperLocation] = useState<string>();
  const [
    syncGoogleDriveClientId,
    setSyncGoogleDriveClientId,
  ] = useState<string>();
  const [
    syncGoogleDriveClientSecret,
    setSyncGoogleDriveClientSecret,
  ] = useState<string>();
  const [paperListHeaderFormat, setPaperListHeaderFormat] = useState<string>();
  const [
    paperListContentFormat,
    setPaperListContentFormat,
  ] = useState<string>();
  const [
    paperListExpandedHeaderFormat,
    setPaperListExpandedHeaderFormat,
  ] = useState<string>();
  const [
    paperListExpandedContentFormat,
    setPaperListExpandedContentFormat,
  ] = useState<string>();
  const [searchPaperSources, setSearchPaperSources] = useState<string[]>([]);
  const [fetchPaperSources, setFetchPaperSources] = useState<string[]>([]);

  const fields: [string, any, React.SetStateAction<any>][] = [
    ['dataLocation', dataLocation, setDataLocation],
    ['paperLocation', paperLocation, setPaperLocation],
    ['sync.googleDrive.code', syncGoogleDriveCode, setSyncGoogleDriveCode],
    [
      'sync.googleDrive.clientId',
      syncGoogleDriveClientId,
      setSyncGoogleDriveClientId,
    ],
    ['sync.method', syncMethod, setSyncMethod],
    [
      'sync.googleDrive.clientSecret',
      syncGoogleDriveClientSecret,
      setSyncGoogleDriveClientSecret,
    ],
    ['paperList.headerFormat', paperListHeaderFormat, setPaperListHeaderFormat],
    [
      'paperList.contentFormat',
      paperListContentFormat,
      setPaperListContentFormat,
    ],
    [
      'paperList.expandedHeaderFormat',
      paperListExpandedHeaderFormat,
      setPaperListExpandedHeaderFormat,
    ],
    [
      'paperList.expandedContentFormat',
      paperListExpandedContentFormat,
      setPaperListExpandedContentFormat,
    ],
    ['searchPaperSources', searchPaperSources, setSearchPaperSources],
    ['fetchPaperSources', fetchPaperSources, setFetchPaperSources],
  ];

  useEffect(() => {
    fields.forEach(([key, _, setFn]) => setFn(store.get(key)));
  }, []);

  const save = () => {
    if (dataLocation !== store.get('dataLocation')) {
      changeDataStoreCwd(dataLocation);
    }
    fields.forEach(([key, val, _]) =>
      val ? store.set(key, val) : store.delete(key)
    );
    const window = remote.getCurrentWindow();
    window.close();
  };

  return (
    <Box styles={{ width: '100vw', height: '100vh' }} gap="gap.medium">
      <Flex
        column
        styles={{
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
        }}
        padding="padding.medium"
        gap="gap.medium"
      >
        <Section
          title="Paper List"
          desc="Specify how items appear in the list. Supported fields: {title}, {authorShort}, {venue}, {year}, {venueAndYear}, {abstract}"
          items={[
            <FormInput
              key="header"
              label="Header"
              fluid
              value={paperListHeaderFormat}
              showSuccessIndicator={false}
              onChange={(_, p) => {
                setPaperListHeaderFormat(p?.value);
              }}
            />,
            <FormInput
              key="content"
              label="Content"
              fluid
              value={paperListContentFormat}
              showSuccessIndicator={false}
              onChange={(_, p) => {
                setPaperListContentFormat(p?.value);
              }}
            />,
            <FormInput
              key="header-expanded"
              label="Header (Expanded Mode)"
              fluid
              value={paperListExpandedHeaderFormat}
              showSuccessIndicator={false}
              onChange={(_, p) => {
                setPaperListExpandedHeaderFormat(p?.value);
              }}
            />,
            <FormInput
              key="content-expanded"
              label="Content (Expanded Mode)"
              fluid
              value={paperListExpandedContentFormat}
              showSuccessIndicator={false}
              onChange={(_, p) => {
                setPaperListExpandedContentFormat(p?.value);
              }}
            />,
          ]}
        />

        <Section
          title="Download"
          items={[
            <FormInput
              key="paper-location"
              label="Paper Location"
              fluid
              value={paperLocation}
              onChange={(_, p) => {
                setPaperLocation(p?.value);
              }}
            />,
          ]}
        />

        <Section
          title="Sources"
          items={[
            <FormDropdown
              key="search"
              search
              fluid
              multiple
              value={searchPaperSources}
              onChange={(_, p) => {
                setSearchPaperSources(p?.value);
              }}
              items={Object.keys(Sources)}
              noResultsMessage="We couldn't find any matches."
              a11ySelectedItemsMessage="Press Delete or Backspace to remove"
              label="Search Sources"
            />,
            <FormDropdown
              key="fetch"
              search
              fluid
              multiple
              value={fetchPaperSources}
              onChange={(_, p) => {
                setFetchPaperSources(p?.value);
              }}
              items={Object.keys(Sources)}
              noResultsMessage="We couldn't find any matches."
              a11ySelectedItemsMessage="Press Delete or Backspace to remove"
              label="Fetch Sources"
            />,
          ]}
        />

        <Section
          title="Sync (Experimental)"
          content={
            <Box>
              <RadioGroup
                checkedValue={syncMethod}
                items={[
                  {
                    name: 'sync',
                    key: 'none',
                    label: 'None',
                    value: 'none',
                  },
                  {
                    name: 'sync',
                    key: 'own',
                    label: 'Your Cloud Sync App',
                    value: 'own',
                  },
                  {
                    name: 'sync',
                    key: 'googleDrive',
                    label: 'Google Drive',
                    value: 'googleDrive',
                    disabled: true,
                  },
                ]}
                onCheckedValueChange={(_, p) => {
                  setSyncMethod(p?.value);
                }}
                style={{ paddingBottom: '16px' }}
              />
              {syncMethod === 'googleDrive' && (
                <Flex column gap="gap.small">
                  <Text
                    temporary
                    size="small"
                    content="You need to create your own OAuth client id and secret. Google Drive Sync is experimental and only works one-way."
                  />
                  <FormInput
                    label="Client ID"
                    fluid
                    value={syncGoogleDriveClientId}
                    showSuccessIndicator={false}
                    onChange={(_, p) => {
                      setSyncGoogleDriveClientId(p?.value);
                    }}
                  />
                  <FormInput
                    label="Client Secret"
                    fluid
                    value={syncGoogleDriveClientSecret}
                    showSuccessIndicator={false}
                    onChange={(_, p) => {
                      setSyncGoogleDriveClientSecret(p?.value);
                    }}
                  />
                  <FormInput
                    label="Code"
                    fluid
                    value={syncGoogleDriveCode}
                    showSuccessIndicator={false}
                    onChange={(_, p) => {
                      setSyncGoogleDriveCode(p?.value);
                    }}
                  />
                  <Button
                    content="Get code"
                    onClick={() => shell.openExternal(getAuthUrl())}
                  />
                </Flex>
              )}
              {syncMethod === 'own' && (
                <Flex column gap="gap.small">
                  <Text
                    temporary
                    size="small"
                    content="Specify a location to store application's data. You need to set up your cloud service's app to sync this folder."
                  />
                  <FormInput
                    label="Sync Location"
                    fluid
                    value={dataLocation}
                    showSuccessIndicator={false}
                    onChange={(_, p) => {
                      setDataLocation(p?.value);
                    }}
                  />
                </Flex>
              )}
            </Box>
          }
        />
      </Flex>

      <Divider />
      <Flex padding="padding.medium" hAlign="center">
        <Button primary content="Save" onClick={save} />
      </Flex>
    </Box>
  );
}
