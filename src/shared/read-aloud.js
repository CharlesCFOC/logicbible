export function createReadAloud({ requestAudio, createAudio, createUrl, revokeUrl }) {
  const listeners = new Set();
  // Keep recent clips in memory only, avoiding another generation on replay.
  const cache = new Map();
  let cacheBytes = 0;
  let active = null;
  let state = { id: null, speaking: false, loading: false, error: '' };
  function publish(next) { state = next; listeners.forEach(listener => listener()); }
  function stop(id) {
    if (!active || (id !== undefined && active.id !== id)) return;
    const previous = active;
    active = null;
    previous.controller.abort();
    if (previous.audio) {
      previous.audio.onended = previous.audio.onerror = null;
      previous.audio.pause();
      previous.audio.removeAttribute('src');
      previous.audio.load();
    }
    if (previous.url) revokeUrl(previous.url);
    publish({ id: null, speaking: false, loading: false, error: '' });
  }
  async function toggle(id, text, language = 'en') {
    if (active?.id === id) { stop(id); return; }
    stop();
    const input = String(text || '').trim();
    if (!input) return;
    const session = { id, controller: new AbortController(), audio: null, url: null };
    active = session;
    publish({ id, speaking: false, loading: true, error: '' });
    try {
      const key = `${language}:${input}`;
      let blob = cache.get(key);
      if (!blob) {
        blob = await requestAudio(input, { language, signal: session.controller.signal });
        if (active !== session) return;
        if (!blob?.size) throw new Error('No audio was returned. Please try again.');
        if (blob.size <= 8_000_000) {
          cache.set(key, blob); cacheBytes += blob.size;
          while (cache.size > 8 || cacheBytes > 8_000_000) {
            const oldest = cache.keys().next().value;
            cacheBytes -= cache.get(oldest).size; cache.delete(oldest);
          }
        }
      }
      if (active !== session) return;
      session.url = createUrl(blob);
      session.audio = createAudio(session.url);
      session.audio.onended = () => { if (active === session) stop(id); };
      session.audio.onerror = () => fail(new Error('Audio playback failed. Please try again.'));
      await session.audio.play();
      if (active === session) publish({ id, speaking: true, loading: false, error: '' });
    } catch (error) { fail(error); }
    function fail(error) {
      if (active !== session) return;
      stop(id);
      publish({ id, speaking: false, loading: false, error: error.name === 'NotAllowedError' ? 'Tap Read aloud again to start audio playback.' : error.message || 'Natural voice is unavailable. Please try again.' });
    }
  }
  return { toggle, stop, getState: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
}
