import React from 'react';
import { createRoot } from 'react-dom/client';
import { installMobilePortfolioDragGate } from './mobilePortfolioDragGate.js';

function ViteRuntime() {
  return <span aria-hidden="true" data-react-vite-ready="true" />;
}

const runtimeMount = document.querySelector('#react-vite-runtime');

if (runtimeMount) {
  createRoot(runtimeMount).render(<ViteRuntime />);
}

installMobilePortfolioDragGate({
  gallery: document.querySelector('.infinite-menu'),
  canvas: document.querySelector('[data-infinite-menu-canvas]'),
  handle: document.querySelector('[data-mobile-portfolio-drag-handle]'),
  mediaQuery: window.matchMedia('(max-width: 760px)')
});
