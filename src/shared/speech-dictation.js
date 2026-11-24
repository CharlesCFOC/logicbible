export const dictationLanguages = { fr: { locale: 'fr-CA', label: 'French' }, en: { locale: 'en-US', label: 'English' } };
const errorMessages = {
  'not-allowed': 'Allow microphone access in your browser to use dictation.',
  'service-not-allowed': 'Your browser has blocked dictation. Check the microphone permissions.',
  'audio-capture': 'No microphone is available. Check that it is connected and allowed.',
  'no-speech': 'No speech detected. Move closer to the microphone and try again.',
  network: 'Voice transcription needs a connection. Check your connection and try again.',
  'language-not-supported': 'This dictation language is not available in your browser.',
};

// Rebuild the current utterance in place as recognition revises it. The prefix
// typed before dictation stays intact, and manual edits stop late voice updates.
export function createDictationSession({ createRecognition, getText, writeText, onState, maxLength = 1200, restartDelayMs = 250, silenceTimeoutMs = 0 }) {
  let active = null;
  let disposed = false;
  function emit(session, phase, message, interim = '', error = false) {
    if (!disposed) onState({ field: session.field, phase, message, interim, error });
  }
  function detach(session) {
    clearTimeout(session.stopTimer);
    clearTimeout(session.restartTimer);
    clearTimeout(session.silenceTimer);
    for (const handler of ['onstart', 'onresult', 'onerror', 'onend', 'onspeechstart', 'onspeechend']) session.recognition[handler] = null;
    if (active === session) active = null;
  }
  function finish(session, message, error = false, abort = false) {
    if (active !== session) return;
    detach(session);
    if (abort) { try { session.recognition.abort(); } catch { /* Already stopped. */ } }
    emit(session, 'idle', message, '', error);
  }
  function stop() {
    const session = active;
    if (!session || session.stopping) return;
    session.stopping = true;
    clearTimeout(session.silenceTimer);
    emit(session, 'finishing', 'Microphone off. Finishing your transcription…');
    if (session.restartTimer !== null) {
      finish(session, '');
      return;
    }
    session.stopTimer = setTimeout(() => finish(session, session.received ? '' : 'No text received. You can try again.', false, true), 5000);
    try { session.recognition.stop(); }
    catch { finish(session, 'The microphone could not stop normally. You can try again.', true, true); }
  }
  function start(field, language) {
    if (disposed || active || !dictationLanguages[language]) return false;
    let recognition;
    try { recognition = createRecognition(); }
    catch { /* Unsupported recognition is handled below. */ }
    if (!recognition) {
      onState({ field, phase: 'idle', interim: '', error: true, message: 'Voice dictation is not available in this browser. You can use the microphone on your device’s keyboard.' });
      return false;
    }
    const prefix = String(getText(field) || '');
    const session = { field, recognition, prefix, lastWritten: prefix, received: false, stopping: false, limited: false, stopTimer: null, restartTimer: null, silenceTimer: null, audioMonitoring: false, heardVoice: false };
    active = session;
    recognition.lang = dictationLanguages[language].locale;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    const listeningMessage = `Listening in ${dictationLanguages[language].label}…`;
    const scheduleSilenceStop = () => {
      if (!silenceTimeoutMs || session.stopping || session.audioMonitoring || session.silenceTimer !== null) return;
      session.silenceTimer = setTimeout(() => { session.silenceTimer = null; if (active === session) stop(); }, silenceTimeoutMs);
    };
    recognition.onstart = () => { if (active === session && !session.stopping) emit(session, 'listening', listeningMessage); };
    recognition.onspeechstart = () => { clearTimeout(session.silenceTimer); session.silenceTimer = null; };
    recognition.onspeechend = scheduleSilenceStop;
    recognition.onresult = event => {
      if (active !== session) return;
      if (String(getText(field) || '') !== session.lastWritten) {
        finish(session, 'Dictation stopped so you can edit the text.', false, true);
        return;
      }
      const parts = [];
      let interim = '';
      for (let index = 0; index < event.results.length; index++) {
        const result = event.results[index];
        const transcript = String(result[0]?.transcript || '').trim();
        if (transcript) parts.push(transcript);
        if (!result.isFinal) interim += `${transcript} `;
      }
      const spoken = parts.join(' ');
      if (spoken) {
        const separator = session.prefix && !/\s$/.test(session.prefix) && !/^[.,!?;:]/.test(spoken) ? ' ' : '';
        const next = `${session.prefix}${separator}${spoken}`;
        session.lastWritten = next.slice(0, maxLength);
        writeText(field, session.lastWritten);
        session.received = true;
        if (next.length >= maxLength) { session.limited = true; stop(); return; }
      }
      emit(session, session.stopping ? 'finishing' : 'listening', session.stopping ? 'Microphone off. Finishing your transcription…' : listeningMessage, interim.trim().slice(0, maxLength));
    };
    recognition.onerror = event => {
      if (active !== session) return;
      // Some browsers end even continuous recognition after a silent interval.
      // Their following end event resumes listening until the user clicks stop.
      if (event.error === 'no-speech' && !session.stopping) return;
      finish(session, errorMessages[event.error] || (event.error === 'aborted' ? '' : 'Dictation could not be completed. Try again.'), event.error !== 'aborted', true);
    };
    recognition.onend = () => {
      if (active !== session) return;
      if (session.stopping) {
        finish(session, session.limited ? `The ${maxLength}-character limit has been reached. You can edit the text.` : '');
        return;
      }
      if (session.received) scheduleSilenceStop();
      if (session.restartTimer !== null) return;
      session.restartTimer = setTimeout(() => {
        session.restartTimer = null;
        if (active !== session || session.stopping) return;
        if (String(getText(field) || '') !== session.lastWritten) {
          finish(session, 'Dictation stopped so you can edit the text.', false, true);
          return;
        }
        // A new recognition run starts its result list at zero. Keep the text
        // already transcribed as the prefix so resumed speech appends once.
        session.prefix = session.lastWritten;
        try { recognition.start(); }
        catch { finish(session, 'The microphone could not restart. Click it to try again.', true, true); }
      }, restartDelayMs);
    };
    emit(session, 'starting', 'Starting the microphone… Allow access if your browser asks.');
    try { recognition.start(); return true; }
    catch { finish(session, 'The microphone could not start. Check its permissions and try again.', true, true); return false; }
  }
  function stopForEdit(field) {
    if (active?.field === field) finish(active, 'Dictation stopped so you can edit the text.', false, true);
  }
  function setAudioMonitoring(enabled) {
    if (!active || !silenceTimeoutMs) return;
    active.audioMonitoring = enabled;
    if (enabled) { clearTimeout(active.silenceTimer); active.silenceTimer = null; }
  }
  function audioLevel(level) {
    const session = active;
    if (!session || !silenceTimeoutMs || !session.audioMonitoring || session.stopping) return;
    if (level >= .018) {
      session.heardVoice = true;
      clearTimeout(session.silenceTimer);
      session.silenceTimer = null;
    } else if (session.heardVoice && session.silenceTimer === null) {
      session.silenceTimer = setTimeout(() => { session.silenceTimer = null; if (active === session) stop(); }, silenceTimeoutMs);
    }
  }
  function dispose() {
    disposed = true;
    if (active) {
      const session = active;
      detach(session);
      try { session.recognition.abort(); } catch { /* Already stopped. */ }
    }
  }
  return { start, stop, stopForEdit, setAudioMonitoring, audioLevel, dispose };
}
