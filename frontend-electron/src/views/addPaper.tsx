import React, { useEffect, useState } from 'react';
import {
  Form,
  Button,
  Flex,
  FormInput,
  FormField,
  TrashCanIcon,
  ComposeIcon,
} from '@fluentui/react-northstar';
import { useLocation } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';
import { remote } from 'electron';
import Paper, {
  fetchPaper,
  getAllAuthors,
  getAllTags,
  getPaper,
} from '../utils/paper';

export default function AddPaper() {
  const query = new URLSearchParams(useLocation().search);
  const id = query.get('id')!;
  const [title, setTitle] = useState<string>();
  const [url, setUrl] = useState<string>();
  const [tags, setTags] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);

  const close = () => remote.getCurrentWindow().close();

  const setPaper = (p: Paper) => {
    if (p) {
      setTitle(p.title);
      setUrl(p.pdfUrl);
      setAuthors(p.authors);
      setTags(p.tags);
    }
  };

  const save = () => {
    const p = getPaper(id)!;
    p.title = title;
    p.pdfUrl = url;
    p.tags = tags;
    p.authors = authors;
    p.serialize();
    close();
  };

  const autoFill = () => {
    fetchPaper(
      new Paper({
        id,
        title,
        pdfUrl: url,
        tags,
        authors,
      })
    )
      .then((p) => setPaper(p))
      .catch((err) => console.log(err));
  };

  const remove = () => {
    Paper.delete(id);
    close();
  };

  useEffect(() => {
    const paper = getPaper(id);
    if (paper) setPaper(paper);
  }, []);

  return (
    <Flex fill column padding="padding.medium" styles={{ height: '100vh' }}>
      <Flex.Item grow align="start" styles={{ justifyContent: 'start' }}>
        <Form>
          <FormInput
            required
            fluid
            style={{ fontSize: 20 }}
            value={title}
            showSuccessIndicator={false}
            onChange={(_, props) => setTitle(props!.value)}
            message={
              <Flex fill vAlign="end">
                <Button
                  content="Auto Fill"
                  text
                  icon={<ComposeIcon />}
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
          <FormInput
            label="URL"
            fluid
            value={url}
            onChange={(_, props) => setUrl(props!.value)}
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
      <Flex.Item>
        <Flex gap="gap.smaller" space="between">
          <Button
            text
            icon={<TrashCanIcon />}
            content="Remove"
            secondary
            onClick={remove}
          />
          <Flex gap="gap.small">
            <Button content="Save" primary onClick={save} />
            <Button
              content="Cancel"
              secondary
              onClick={remote.getCurrentWindow().close}
            />
          </Flex>
        </Flex>
      </Flex.Item>
    </Flex>
  );
}
