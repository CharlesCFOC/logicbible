import { useEffect, useRef, useState } from 'react';
import { createDictationSession } from '../shared/speech-dictation.js';
import { stopReadAloud } from './read-aloud.jsx';

export function useDictation({ values, onChange, language = 'en', maxLength = 1200, silenceTimeoutMs = 0 }) {
  const [state, setState] = useState({ field: null, phase: 'idle', message: '', interim: '', error: false });
  const session = useRef(null);
  const valuesRef = useRef(values);
  const changeRef = useRef(onChange);
  valuesRef.current = values;
  changeRef.current = onChange;
  useEffect(() => {
    const stopIfHidden = () => { if (document.hidden) session.current?.stop(); };
    const stopOnNavigation = () => session.current?.stop();
    document.addEventListener('visibilitychange', stopIfHidden);
    window.addEventListener('app:screen-change', stopOnNavigation);
    return () => {
      document.removeEventListener('visibilitychange', stopIfHidden);
      window.removeEventListener('app:screen-change', stopOnNavigation);
      session.current?.dispose();
      session.current = null;
    };
  }, []);
  function start(field) {
    stopReadAloud();
    if (!session.current) session.current = createDictationSession({
      createRecognition: () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        return Recognition ? new Recognition() : null;
      },
      getText: key => valuesRef.current[key],
      writeText: (key, text) => {
        // Keep the live textarea value available to the next recognition event.
        valuesRef.current = { ...valuesRef.current, [key]: text };
        changeRef.current(key, text);
      },
      onState: setState,
      maxLength,
      silenceTimeoutMs,
    });
    session.current.start(field, language);
  }
  function edit(field, text) {
    session.current?.stopForEdit(field);
    valuesRef.current = { ...valuesRef.current, [field]: text };
    changeRef.current(field, text);
  }
  return { ...state, start, edit, stop: () => session.current?.stop(), setAudioMonitoring: enabled => session.current?.setAudioMonitoring(enabled), audioLevel: level => session.current?.audioLevel(level), active: state.phase !== 'idle' };
}
