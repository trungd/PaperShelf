import { Flex, Header, Button, AddIcon, Text } from '@fluentui/react-northstar';
import React, { useEffect, useState } from 'react';
import Paper, { fetchPaper } from '../utils/paper';

const PaperInfoPopup = ({
  paper,
  onLoaded,
  addToLibrary,
}: {
  paper?: Paper;
  onLoaded: () => void;
  addToLibrary: (p: Paper) => void;
}) => {
  const [fetchedPaper, setFetchedPaper] = useState<Paper>();

  useEffect(() => {
    setFetchedPaper(paper);
    if (paper) {
      fetchPaper(
        new Paper({
          title: paper?.title,
          pdfUrl: paper?.pdfUrl,
          authors: paper?.authors,
        })
      )
        .then((p) => p.populateFieldsFromSources())
        .then((p) => setFetchedPaper(p))
        .then(onLoaded)
        .catch(() => {});
    }
  }, [paper]);

  return (
    <Flex column style={{ maxWidth: '500px' }}>
      {fetchedPaper ? (
        <Flex column>
          <Header as="h3">{fetchedPaper?.title}</Header>
          <Text temporary content={fetchedPaper?.authors.join(', ')} />
          <Text content={fetchedPaper?.abstract} as="p" />
        </Flex>
      ) : (
        <Text temporary content="No paper found." as="p" />
      )}

      <Flex row hAlign="end">
        <Button
          text
          content="Add to Library"
          icon={<AddIcon />}
          onClick={() => {
            if (fetchedPaper) addToLibrary(fetchedPaper);
          }}
          disabled={!fetchedPaper?.pdfUrl || fetchedPaper?.inLibrary}
        />
      </Flex>
    </Flex>
  );
};

export default PaperInfoPopup;
