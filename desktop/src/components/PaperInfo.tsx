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
  Checkbox,
  Text,
  DownloadIcon,
  Divider,
  List,
  ListItemProps,
} from '@fluentui/react-northstar';
import CreatableSelect from 'react-select/creatable';
import TextareaAutosize from 'react-textarea-autosize';
import Paper, { fetchPaper, getAllAuthors, getAllTags } from '../utils/paper';

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

  const [isTitleFetching, setIsTitleFetching] = useState<boolean>(false);
  const [isUrlFetching, setIsUrlFetching] = useState<boolean>(false);
  const [isAutoFill, setIsAutoFill] = useState<boolean>(true);

  const [edittedPaper, setEdittedPaper] = useState<Paper>(new Paper());

  const populateFields = (p: Paper) => {
    setEdittedPaper(p);
  };

  const save = () => {
    const p = paper || new Paper();
    const { title, pdfUrl, tags, authors, abstract } = edittedPaper!;
    Object.assign(p, { title, pdfUrl, tags, authors, abstract });
    p.serialize();
  };

  const fetchByTitle = () => {
    setIsTitleFetching(true);
    fetchPaper(
      new Paper({
        title: edittedPaper.title,
        pdfUrl: edittedPaper?.pdfUrl,
        tags: edittedPaper.tags,
        authors: edittedPaper?.authors,
      })
    )
      .then((p) => populateFields(p))
      .then(() => setIsTitleFetching(false))
      .catch(() => {});
  };

  const fetchByUrl = () => {
    setIsUrlFetching(true);
    fetchPaper(
      new Paper({
        title: edittedPaper.title,
        pdfUrl: edittedPaper?.pdfUrl,
        tags: edittedPaper.tags,
        authors: edittedPaper?.authors,
      })
    )
      .then((p: Paper) => populateFields(p))
      .then(() => setIsUrlFetching(false))
      .catch(() => {});
  };

  const remove = () => {
    if (paper != null) {
      onRemovePaper(paper);
    }
  };

  const changePaper = (newPaper: Paper | null) => {
    if (paper) {
      save();
    }

    if (newPaper) {
      populateFields(newPaper);
    }

    setPaper(newPaper);
  };

  useEffect(() => changePaper(currentPaper), [currentPaper]);

  return (
    <Flex fill column styles={{ height: '100%', width: '100%' }}>
      <Flex space="between">
        <Button
          text
          content="Back"
          icon={<ArrowLeftIcon />}
          onClick={onClose}
        />
        <Flex gap="gap.small">
          <Button
            text
            content="Remove"
            icon={<TrashCanIcon />}
            onClick={remove}
          />
        </Flex>
      </Flex>
      <Flex.Item
        styles={{
          justifyContent: 'start',
          height: 'calc(100% - 32px)',
          padding: '16px',
          overflowY: 'auto',
        }}
      >
        <Form>
          <Flex vAlign="center">
            <Flex.Item grow>
              <FormInput
                required
                fluid
                style={{ fontSize: 20 }}
                value={edittedPaper.title}
                showSuccessIndicator={false}
                onChange={(_, p) => {
                  edittedPaper.title = p?.value || '';
                }}
              />
            </Flex.Item>
            <Button
              primary
              text
              content="Fetch"
              size="small"
              icon={
                isTitleFetching ? <Loader size="smaller" /> : <DownloadIcon />
              }
              onClick={() => fetchByTitle()}
              disabled={!isAutoFill || isTitleFetching}
            />
          </Flex>
          <Flex vAlign="center">
            <Flex.Item grow>
              <FormInput
                fluid
                value={edittedPaper.pdfUrl}
                onChange={(_, p) => {
                  edittedPaper.pdfUrl = p?.value || '';
                }}
              />
            </Flex.Item>
            <Button
              primary
              text
              content="Fetch"
              size="small"
              icon={
                isUrlFetching ? <Loader size="smaller" /> : <DownloadIcon />
              }
              onClick={() => fetchByUrl()}
              disabled={!isAutoFill || isUrlFetching}
            />
          </Flex>

          <Divider />
          <Checkbox
            checked={isAutoFill}
            onChange={(_, p) => {
              setIsAutoFill(p?.checked);
              if (p?.checked) {
                if (edittedPaper.pdfUrl) fetchByUrl();
                else if (edittedPaper.title) fetchByTitle();
              }
            }}
            label="Fill the following fields by Title and/or URL"
          />
          <FormField
            label="Authors"
            control={
              isAutoFill
                ? { as: Text, content: edittedPaper.authors.join(', ') }
                : {
                    as: CreatableSelect,
                    isDisabled: isAutoFill,
                    isMulti: true,
                    createOptionPosition: 'first',
                    options: getAllAuthors().map((a) => ({
                      value: a,
                      label: a,
                    })),
                    value: edittedPaper.authors.map((a) => ({
                      value: a,
                      label: a,
                    })),
                    onChange: (objs: any[]) => {
                      edittedPaper.authors = objs.map((o) => o.value);
                    },
                  }
            }
          />
          <FormField
            label="Tags"
            control={
              isAutoFill
                ? { as: Text, content: edittedPaper.tags.join(', ') }
                : {
                    as: CreatableSelect,
                    isMulti: true,
                    isDisabled: true,
                    createOptionPosition: 'first',
                    options: getAllTags().map((t) => ({ value: t, label: t })),
                    value: edittedPaper.tags.map((t) => ({
                      value: t,
                      label: t,
                    })),
                    onChange: (objs: any[]) => {
                      edittedPaper.tags = objs.map((o) => o.value);
                    },
                    disabled: isAutoFill,
                  }
            }
          />
          <FormField
            label="Abstract"
            control={
              isAutoFill
                ? { as: Text, content: edittedPaper.abstract }
                : {
                    as: TextareaAutosize,
                    fluid: true,
                    style: { width: '100%' },
                    value: edittedPaper.abstract,
                    disabled: isAutoFill,
                    onChange: (_, p) => {
                      edittedPaper.abstract = p?.value;
                    },
                  }
            }
          />
          <FormField
            label="References"
            control={
              isAutoFill
                ? {
                    as: List,
                    navigable: true,
                    truncateHeader: true,
                    truncateContent: true,
                    items: edittedPaper?.references.map(
                      (p) =>
                        ({
                          header: p.title,
                          content: p.authors.join(', '),
                        } as ListItemProps)
                    ),
                  }
                : {
                    as: TextareaAutosize,
                    fluid: true,
                    style: { width: '100%' },
                    value: edittedPaper?.references,
                    disabled: isAutoFill,
                    onChange: (_, p) => {
                      edittedPaper.references = p?.value;
                    },
                  }
            }
          />
        </Form>
      </Flex.Item>
    </Flex>
  );
}
