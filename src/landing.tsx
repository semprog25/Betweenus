import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPages } from './landing-pages';
import './styles/globals.css';

// This is a separate entry point for the landing pages
// Access via /landing route

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LandingPages />
  </React.StrictMode>,
);
