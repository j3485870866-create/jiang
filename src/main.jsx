import React from 'react';
import { createRoot } from 'react-dom/client';

function ViteRuntime() {
  return <span aria-hidden="true" data-react-vite-ready="true" />;
}

const runtimeMount = document.querySelector('#react-vite-runtime');

if (runtimeMount) {
  createRoot(runtimeMount).render(<ViteRuntime />);
}
