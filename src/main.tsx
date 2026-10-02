import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import App from './App';
import './index.css';

(window as any).__ton_addr = (a: string) => Address.parse(a).toString();

const MANIFEST_URL = new URL(
  'tonconnect-manifest.json',
  window.location.href
).toString();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>
);
