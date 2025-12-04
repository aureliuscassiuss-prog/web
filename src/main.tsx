import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')!;

import { HelmetProvider } from 'react-helmet-async';

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)

// Mark as ready to prevent flash
setTimeout(() => {
  rootElement.classList.add('ready');
}, 0);

