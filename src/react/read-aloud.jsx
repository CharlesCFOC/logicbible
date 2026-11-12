import React, { useEffect, useId, useSyncExternalStore } from 'react';
import { createReadAloud } from '../shared/read-aloud.js';

const reader = createReadAloud({
  requestAudio: async (text, options) => {
    const { requestReadAloud } = await import('./pilot-ai.js');
    if (options.signal.aborted) throw new DOMException('Stopped', 'AbortError');
    return requestReadAloud(text, options);
  },
  createAudio: url => new Audio(url),
  createUrl: blob => URL.createObjectURL(blob),
  revokeUrl: url => URL.revokeObjectURL(url),
});
export const stopReadAloud = () => reader.stop();

export function ReadAloudButton({ text, label, language = 'en', disabled = false }) {
  const id = useId();
  const state = useSyncExternalStore(reader.subscribe, reader.getState);
  const speaking = state.id === id && (state.speaking || state.loading);
  const loading = state.id === id && state.loading;
  const error = state.id === id ? state.error : '';
  const actionLabel = `${loading ? 'Cancel audio preparation' : speaking ? 'Stop reading' : 'Read aloud'}: ${label}`;
  // Editing the text or leaving its scene stops the previous spoken version.
  useEffect(() => () => reader.stop(id), [id, text]);
  useEffect(() => { if (disabled) reader.stop(id); }, [id, disabled]);
  useEffect(() => {
    const stopIfHidden = () => { if (document.hidden) reader.stop(id); };
    document.addEventListener('visibilitychange', stopIfHidden);
    return () => document.removeEventListener('visibilitychange', stopIfHidden);
  }, [id]);
  return <span className="read-aloud-control">
    <button type="button" className={`read-aloud-button${loading ? ' is-loading' : ''}`} disabled={disabled || !String(text || '').trim()} aria-label={actionLabel} title={`${actionLabel} · AI voice`} aria-pressed={speaking} onClick={() => reader.toggle(id, text, language)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{loading ? <path d="M20 12a8 8 0 1 1-8-8" /> : speaking ? <rect x="6" y="6" width="12" height="12" rx="2" /> : <><path d="M11 5 6 9H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>}</svg>
    </button>
    <span className="read-aloud-status" role="status">{loading ? 'Preparing voice…' : ''}</span>
    {error && <span className="read-aloud-error" role="status">{error}</span>}
  </span>;
}
