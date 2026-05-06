import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initHttpClient } from '@org/person-locator'

declare const __VITE_MOCK__: boolean;

initHttpClient({
  timeout: 5000,
  // When running with VITE_MOCK=true, redirect ES calls to the Vite dev server
  ...(__VITE_MOCK__ && { baseURL: window.location.origin }),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
