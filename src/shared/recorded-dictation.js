// Record locally until silence, then insert the transcript without replacing edits.
export function createRecordedDictationSession({ createRecorder, transcribe, getText, writeText, onState, onLevels = () => {}, maxLength = 1200 }) {
  let active = null;
  let disposed = false;
  function emit(session, phase, message = '', error = false) {
    if (!disposed && active === session) onState({ field: session.field, phase, message, interim: '', error });
  }
  function finish(session, message = '', error = false) {
    if (active !== session) return;
    emit(session, 'idle', message, error);
    active = null;
  }
  function cancel() {
    if (!active) return;
    const session = active;
    active = null;
    session.controller.abort();
    session.recording?.cancel();
  }
  function stop() {
    const session = active;
    if (!session || session.stopping) return;
    session.stopping = true;
    emit(session, 'finishing', 'Finishing your transcription…');
    session.recording.stop();
  }
  function start(field) {
    if (disposed || active) return false;
    const session = { field, prefix: String(getText(field) || ''), controller: new AbortController(), recording: null, stopping: false };
    active = session;
    emit(session, 'starting', 'Starting the microphone…');
    try {
      session.recording = createRecorder({
        onReady: () => { if (!session.stopping) emit(session, 'listening', 'Listening…'); },
        onSilence: () => { session.stopping = true; emit(session, 'finishing', 'Finishing your transcription…'); },
        onLevels: levels => { if (active === session && !disposed) onLevels(levels); },
      });
    } catch (error) {
      finish(session, error.message || 'The microphone could not start.', true);
      return false;
    }
    void (async () => {
      try {
        const blob = await session.recording.done;
        if (active !== session) return;
        if (!blob?.size) { finish(session, 'No speech was recorded. Please try again.', true); return; }
        session.stopping = true;
        emit(session, 'finishing', 'Finishing your transcription…');
        const text = String(await transcribe(blob, { signal: session.controller.signal }) || '').trim();
        if (active !== session) return;
        if (String(getText(field) || '') !== session.prefix) { finish(session, ''); return; }
        if (!text) { finish(session, 'No speech was recognized. Please try again.', true); return; }
        const separator = session.prefix && !/\s$/.test(session.prefix) && !/^[.,!?;:]/.test(text) ? ' ' : '';
        writeText(field, `${session.prefix}${separator}${text}`.slice(0, maxLength));
        finish(session);
      } catch (error) {
        if (active !== session || error.name === 'AbortError') return;
        finish(session, error.name === 'NotAllowedError' ? 'Allow microphone access to use dictation.' : (error.message || 'Dictation could not be completed. Please try again.'), true);
      }
    })();
    return true;
  }
  function stopForEdit(field) {
    if (active?.field !== field) return;
    const session = active;
    emit(session, 'idle');
    cancel();
  }
  function dispose() { disposed = true; cancel(); }
  return { start, stop, stopForEdit, dispose };
}
