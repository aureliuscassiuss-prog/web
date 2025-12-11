import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')!;

import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './contexts/LanguageContext';

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </HelmetProvider>
  </StrictMode>,
)

// Mark as ready to prevent flash
setTimeout(() => {
  rootElement.classList.add('ready');
}, 0);

