import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './ui/App';
import './ui/styles/global.css';

// Installable and offline-capable. `autoUpdate` swaps in a new build on the
// next launch; a failed registration (http, private mode) is not fatal.
registerSW({ immediate: true });

const container = document.getElementById('root');
if (!container) throw new Error('#root element is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
