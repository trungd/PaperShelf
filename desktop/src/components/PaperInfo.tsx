import React, { useEffect, useState } from 'react';
import {
  Form,
  Button,
  Flex,
  FormInput,
  FormField,
  TrashCanIcon,
  ArrowLeftIcon,
  Loader,
  Text,
  DownloadIcon,
  List,
  ListItemProps,
  Box,
  Segment,
  EditIcon,
  Table,
  Tree,
  TriangleDownIcon,
  TriangleEndIcon,
} from '@fluentui/react-northstar';
import CreatableSelect from 'react-select/creatable';
import TextareaAutosize from 'react-textarea-autosize';
import Paper, { fetchPaper, getAllAuthors, getAllTags } from '../utils/paper';
import { processPdf } from '../utils/analyze-pdf';
import { showError } from '../utils/msgbox';

const TabContent = ({
  paper,
  editable,
}: {
  paper: Paper | null;
  editable: boolean;
}) => {
  const mapTreeItems = (outline) =>
    outline
      ? outline.map((it) => ({
          id: it.name,
          title: it.name,
          items: mapTreeItems(it.items),
          expanded: true,
        }))
      : null;

  const titleRenderer = (
    Component,
    { content, expanded, open, hasSubtree, ...restProps }
  ) => (
    <Component expanded={expanded} hasSubtree={hasSubtree} {...restProps}>
      {expanded ? <TriangleDownIcon /> : <TriangleEndIcon />}
      {content}
    </Component>
  );

  return (
    <Form>
      <FormField
        label="Outline"
        control={{
          as: Tree,
          items: mapTreeItems(paper?.pdfInfo?.outline),
          renderItemTitle: titleRenderer,
        }}
      />
      <FormField
        label="Abstract"
        control={
          editable
            ? {
                as: TextareaAutosize,
                fluid: true,
                style: { width: '100%' },
                value: paper?.abstract,
                onChange: (_, p) => {
                  if (paper) paper.abstract = p?.value;
                },
              }
            : { as: Text, content: paper?.abstract }
        }
      />
    </Form>
  );
};

type PaperInfoProps = {
  paper: Paper | null;
  onClose: () => void;
  onRemovePaper: (paper: Paper) => void;
};

export default function PaperInfo({
  paper: currentPaper,
  onClose,
  onRemovePaper,
}: PaperInfoProps) {
  const [paper, setPaper] = useState<Paper | null>(null);

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isAutoFill, setIsAutoFill] = useState<boolean>(true);

  const fetch = () => {
    if (!paper) return;
    setIsFetching(true);
    paper
      .fetch()
      .then(() => setIsFetching(false))
      .catch((e) => {
        console.log(e);
        showError(e);
        setIsFetching(false);
      });
  };

  const remove = () => {
    if (paper != null) {
      onRemovePaper(paper);
    }
  };

  const changePaper = (newPaper: Paper | null) => {
    if (paper) {
      paper.serialize();
      paper.saveCache();
    }

    if (newPaper) {
      newPaper.loadCache();
    }

    setPaper(newPaper);
  };

  useEffect(() => changePaper(currentPaper), [currentPaper]);

  const sections = [
    {
      key: 'general',
      header: 'General',
      content: (
        <Box>
          <Form>
            <FormInput
              label="Title"
              required
              disabled
              fluid
              value={paper?.title}
              showSuccessIndicator={false}
              onChange={(_, p) => {
                if (paper) paper.title = p?.value || '';
              }}
            />
            <FormInput
              label="URL"
              fluid
              disabled
              value={paper?.pdfUrl}
              onChange={(_, p) => {
                if (paper) paper.pdfUrl = p?.value || '';
              }}
            />
            <FormField
              label="Authors"
              control={{
                as: CreatableSelect,
                isDisabled: isAutoFill,
                isMulti: true,
                createOptionPosition: 'first',
                options: getAllAuthors().map((a) => ({
                  value: a,
                  label: a,
                })),
                value: paper?.authors.map((a) => ({
                  value: a,
                  label: a,
                })),
                onChange: (objs: any[]) => {
                  if (paper) paper.authors = objs.map((o) => o.value);
                },
              }}
            />
            <FormField
              label="Tags"
              control={{
                as: CreatableSelect,
                isMulti: true,
                isDisabled: isAutoFill,
                createOptionPosition: 'first',
                options: getAllTags().map((t) => ({
                  value: t,
                  label: t,
                })),
                value: paper?.tags.map((t) => ({
                  value: t,
                  label: t,
                })),
                onChange: (objs: any[]) => {
                  if (paper) paper.tags = objs.map((o) => o.value);
                },
              }}
            />
          </Form>
        </Box>
      ),
    },
    {
      key: 'pdfInfo',
      header: 'Content',
      content: <TabContent paper={paper} editable={!isAutoFill} />,
    },
    {
      key: 'references',
      header: `References (${paper?.references.length})`,
      content: (
        <List
          navigable
          truncateHeader
          truncateContent
          items={paper?.references.map(
            (p) =>
              ({
                header: p.title,
                content: `${p.authors?.join(', ')} (${
                  p.venue + (p.venue ? ' ' : '') + p.year
                })`,
              } as ListItemProps)
          )}
        />
      ),
    },
    {
      key: 'citations',
      header: `Citations (${paper?.citations.length})`,
      content: (
        <List
          navigable
          truncateHeader
          truncateContent
          items={paper?.citations.map(
            (p) =>
              ({
                header: p.title,
                content: `${p.authors?.join(', ')} (${
                  p.venue + (p.venue ? ' ' : '') + p.year
                })`,
              } as ListItemProps)
          )}
        />
      ),
    },
    {
      key: 'info',
      header: 'Info',
      content: (
        <Table
          compact
          rows={[
            {
              key: '1id',
              items: ['ID', paper?.id],
            },
            {
              key: '2arxivId',
              items: ['ArXiv ID', paper?.arxivId],
            },
            {
              key: 'year',
              items: ['Year', paper?.year],
            },
            {
              key: 'venue',
              items: ['Venue', paper?.venue],
            },
            {
              key: 'localPath',
              items: [
                'Local Path',
                {
                  content: paper?.localPath || 'Not Saved',
                  truncateContent: true,
                },
              ],
            },
            {
              key: 'sources',
              items: ['Sources', Object.keys(paper?.sources || {}).join(', ')],
            },
            {
              key: 'dateAdded',
              items: ['Date Added', paper?.dateAdded?.toLocaleString()],
            },
            {
              key: 'dateModified',
              items: ['Date Modified', paper?.dateModified?.toLocaleString()],
            },
            {
              key: 'starred',
              items: ['Starred', paper?.starred ? '✓' : '✗'],
            },
          ].sort((a, b) => a.key.localeCompare(b.key))}
          aria-label="Compact view static table"
        />
      ),
    },
    {
      key: 'stats',
      header: 'Stats',
      content: (
        <Table
          variables={{
            cellContentOverflow: 'ellipsis',
          }}
          compact
          rows={[
            {
              key: 'num_citations',
              items: ['No. citations', paper?.citations.length],
            },
            {
              key: 'num_citations_inf',
              items: [
                'No. citations (influential)',
                paper?.sources.semanticPaper?.influentialCitationCount,
              ],
            },
          ]}
          aria-label="Compact view static table"
        />
      ),
    },
  ];
  const [currentSection, setCurrentSection] = useState<number | undefined>(0);

  return (
    <Flex fill column styles={{ height: '100%', width: '100%' }}>
      <Flex space="between">
        <Flex>
          <Button text iconOnly icon={<ArrowLeftIcon />} onClick={onClose} />
          <Button text content={paper?.title} />
        </Flex>
        <Flex gap="gap.small">
          <Button
            text
            content={isAutoFill ? 'Off' : 'On'}
            icon={<EditIcon />}
            primary={!isAutoFill}
            onClick={() => setIsAutoFill(!isAutoFill)}
          />
          <Button
            text
            iconOnly
            icon={isFetching ? <Loader size="small" /> : <DownloadIcon />}
            onClick={() => fetch()}
          />
          <Button text iconOnly icon={<TrashCanIcon />} onClick={remove} />
        </Flex>
      </Flex>
      <Flex column padding="padding.medium" gap="gap.medium">
        <Flex column>
          <List
            horizontal
            selectable
            defaultSelectedIndex={0}
            onSelectedIndexChange={(_, p) => {
              setCurrentSection(p?.selectedIndex);
            }}
            items={sections.map((it) => ({ header: it.header }))}
          />
          {sections.map(
            (it, idx) =>
              currentSection === idx && (
                <Segment
                  color="red"
                  style={{
                    width: '100%',
                    height: `calc(100vh - ${100}px)`,
                    overflowY: 'auto',
                  }}
                  key={it.key}
                  content={it.content}
                />
              )
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
