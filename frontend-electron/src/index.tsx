import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, teamsTheme } from '@fluentui/react-northstar';

import App from './App';

ReactDOM.render(
  <Provider theme={teamsTheme}>
    <App />
  </Provider>,
  document.getElementById('root')
);
