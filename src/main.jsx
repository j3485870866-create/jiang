import React from 'react';
import { createRoot } from 'react-dom/client';
import { installAboutPhotoDragGuard } from './aboutPhotoDragGuard.js';
import {
  installMobileMotionBudget,
  markMobileInteractive
} from './mobileMotionBudget.js';
import { installMobilePortfolioDragGate } from './mobilePortfolioDragGate.js';

function ViteRuntime() {
  return <span aria-hidden="true" data-react-vite-ready="true" />;
}

const runtimeMount = document.querySelector('#react-vite-runtime');

if (runtimeMount) {
  createRoot(runtimeMount).render(<ViteRuntime />);
}

installAboutPhotoDragGuard(document.querySelector('#about [data-card-stack], #about .portrait-stack'));

installMobilePortfolioDragGate({
  gallery: document.querySelector('.infinite-menu'),
  canvas: document.querySelector('[data-infinite-menu-canvas]'),
  handle: document.querySelector('[data-mobile-portfolio-drag-handle]'),
  mediaQuery: window.matchMedia('(max-width: 760px)')
});

markMobileInteractive(document.querySelectorAll([
  '#personality .trait-card',
  '#goals .goal-grid > article',
  '#now .work-card',
  '#now .portfolio-card',
  '#contact button',
  '#contact .contact-qr-trigger',
  '.menu-toggle'
].join(', ')));

installMobileMotionBudget({
  root: document.documentElement,
  documentTarget: document,
  sections: document.querySelectorAll('main > section'),
  mobileQuery: window.matchMedia('(max-width: 760px)'),
  reducedMotionQuery: window.matchMedia('(prefers-reduced-motion: reduce)')
});
