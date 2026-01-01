import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// CRITICAL FIX: Polyfill 'process' global to prevent crashes in browser environment
// This ensures that any library trying to access process.env (like Google GenAI or React internals)
// won't crash the application if the define plugin misses something.
if (typeof window !== 'undefined' && !(window as any).process) {
  // @ts-ignore
  window.process = { env: { NODE_ENV: import.meta.env.MODE } };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);