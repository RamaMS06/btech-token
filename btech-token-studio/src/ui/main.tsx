/**
 * UI entrypoint — React 18 root mount
 * -------------------------------------
 * Mounts the App component onto the #root div defined in index.html.
 * React 18's createRoot is used throughout (no ReactDOM.render).
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './styles/globals.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('[BTech Token Studio] #root element not found in document.');
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
