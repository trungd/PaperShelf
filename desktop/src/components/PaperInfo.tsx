import React, { useEffect, useState } from 'react';
import {
  Form,
  Button,
  Flex,
  FormInput,
  FormField,
  TrashCanIcon,
  ComposeIcon,
  SaveIcon,
  TextArea,
  ArrowLeftIcon,
  Loader,
} from '@fluentui/react-northstar';
import CreatableSelect from 'react-select/creatable';
import Paper, { fetchPaper, getAllAuthors, getAllTags } from '../utils/paper';

type PaperInfoProps = {
  paper: Paper | null;
  onClose: () => void;
  onRemovePaper: (paper: Paper) => void;
};

export default function PaperInfo({
  paper,
  onClose,
  onRemovePaper,
}: PaperInfoProps) {
  const [isAutoFillLoading, setIsAutoFillLoading] = useState<boolean>(false);

  const [title, setTitle] = useState<string>('');
  const [abstract, setAbstract] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);

  const populateFields = (p: Paper) => {
    setTitle(p.title || '');
    setUrl(p.pdfUrl || '');
    setAuthors(p.authors);
    setTags(p.tags);
    setAbstract(p.abstract || '');
  };

  const save = () => {
    const p = paper || new Paper();
    Object.assign(p, { title, url, tags, authors, abstract });
    p.serialize();
  };

  const autoFill = () => {
    setIsAutoFillLoading(true);
    fetchPaper(
      new Paper({
        title,
        pdfUrl: url,
        tags,
        authors,
      })
    )
      .then((p) => populateFields(p))
      .then(() => setIsAutoFillLoading(false))
      .catch(() => {});
  };

  const remove = () => {
    if (paper != null) {
      onRemovePaper(paper);
    }
  };

  useEffect(() => {
    if (paper) populateFields(paper);
  }, [paper]);

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
          <Button text content="Save" icon={<SaveIcon />} onClick={save} />
        </Flex>
      </Flex>
      <Flex.Item
        styles={{
          justifyContent: 'start',
          height: 'calc(100% - 32px)',
          padding: '16px',
        }}
      >
        <Form>
          <FormInput
            required
            fluid
            style={{ fontSize: 20 }}
            value={title}
            showSuccessIndicator={false}
            onChange={(_, p) => setTitle(p?.value || '')}
            message={
              <Flex fill vAlign="end">
                <Button
                  text
                  content={isAutoFillLoading ? 'Searching...' : 'Auto Fill'}
                  icon={
                    isAutoFillLoading ? (
                      <Loader size="smaller" />
                    ) : (
                      <ComposeIcon />
                    )
                  }
                  onClick={autoFill}
                />
              </Flex>
            }
          />
          <FormField
            label="Authors"
            control={{
              as: CreatableSelect,
              isMulti: true,
              createOptionPosition: 'first',
              options: getAllAuthors().map((a) => ({ value: a, label: a })),
              value: authors.map((a) => ({ value: a, label: a })),
              onChange: (objs: any[]) => setAuthors(objs.map((o) => o.value)),
            }}
          />
          <FormField
            label="Abstract"
            control={{
              as: TextArea,
              fluid: true,
              value: abstract,
              onChange: (_, p) => setAbstract(p?.value),
            }}
          />
          <FormInput
            label="URL"
            fluid
            value={url}
            onChange={(_, p) => setUrl(p?.value || '')}
          />
          <FormField
            label="Tags"
            control={{
              as: CreatableSelect,
              isMulti: true,
              createOptionPosition: 'first',
              options: getAllTags().map((t) => ({ value: t, label: t })),
              value: tags.map((t) => ({ value: t, label: t })),
              onChange: (objs: any[]) => setTags(objs.map((o) => o.value)),
            }}
          />
        </Form>
      </Flex.Item>
    </Flex>
  );
}
