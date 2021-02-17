import React, { Component } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import PdfViewer from './components/PdfViewer';
import PaperList from './components/PaperList';
import { Flex, Box, Toolbar, AddIcon } from '@fluentui/react-northstar'
import {
  DownloadIcon, OpenOutsideIcon
} from '@fluentui/react-icons-northstar'
import './App.global.css';
import _ from 'lodash';
import throttle from "lodash/throttle";
import { downloadPaper, openPdf } from './utils/paper'

import AddPaper from './views/addPaper';
import { Paper } from './types';

type MainProps = {}
type MainState = {
  pdfWidth: number;
  treeWidth: number;
  selectedPaper?: Paper;
}

class Main extends Component<MainProps, MainState> {
  constructor(props: MainProps) {
    super(props)

    this.state = {
      treeWidth: 300,
      pdfWidth: 0,
      selectedPaper: undefined
    }
  }

  componentDidMount() {
    this.setSize();
    window.addEventListener("resize", throttle(this.setSize, 500))
  }

  componentWillUnmount () {
    window.removeEventListener("resize", throttle(this.setSize, 500))
  }

  setSize = () => {
    this.setState({ pdfWidth: window.innerWidth - this.state.treeWidth });
  }

  render = () => {
    const { selectedPaper } = this.state;

    return (
      <Flex column styles={{height: '100vh'}}>
        <Toolbar
          aria-label="Default"
          items={[
            {
              icon: <AddIcon />,
              iconOnly: true,
              text: true,
              title: "New",
              key: "new",
            },
            {
              key: 'divider-1',
              kind: 'divider',
            },
            {
              icon: <DownloadIcon />,
              iconOnly: true,
              text: true,
              title: "Download",
              tooltip: "Download",
              key: "download",
              disabled: selectedPaper == undefined,
              onClick: () => downloadPaper(selectedPaper!)
            },
            {
              icon: (<OpenOutsideIcon {...{ outline: true }} />),
              key: 'open',
              title: 'Open',
              disabled: selectedPaper == undefined,
              onClick: () => openPdf(selectedPaper!),
            },
          ]}
        />
        <Flex.Item grow>
          <Flex>
            <Flex column>
              <PaperList
                width={this.state.treeWidth}
                onChange={(paper) => this.setState({ selectedPaper: paper })}
              />
            </Flex>
            <PdfViewer paper={selectedPaper} width={this.state.pdfWidth} />
          </Flex>
        </Flex.Item>
        <div>Footer</div>
      </Flex>
    );
  }
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/addPaper" component={AddPaper} />
        <Route path="/" component={Main} />
      </Switch>
    </Router>
  );
}
