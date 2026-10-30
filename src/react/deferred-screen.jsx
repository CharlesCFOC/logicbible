import React from 'react';
import { createRoot } from 'react-dom/client';

// Create a screen's React root on its first visit. Keep it mounted afterward so
// forms, reading progress and in-flight requests survive navigation as before.
export function mountDeferredScreen(node, load, exportName) {
  if (!node) return;
  const screen = node.closest('[data-screen]');
  let started = false;
  const activate = () => {
    if (started || (screen && !screen.classList.contains('is-active'))) return;
    started = true;
    window.removeEventListener('app:screen-change', activate);
    const root = createRoot(node);
    root.render(<p role="status">Loading…</p>);
    load().then(module => {
      const Component = module[exportName];
      root.render(<Component />);
    }).catch(() => {
      root.render(<div role="alert"><p>This page could not load. Check your connection and try again.</p><button type="button" onClick={() => window.location.reload()}>Reload page</button></div>);
    });
  };
  window.addEventListener('app:screen-change', activate);
  activate();
}
