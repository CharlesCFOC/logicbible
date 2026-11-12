import { useEffect, useRef, useState } from 'react';
import { createDictationSession } from '../shared/speech-dictation.js';
import { stopReadAloud } from './read-aloud.jsx';

export function useDictation({ values, onChange }) {
  const [state, setState] = useState({ field: null, phase: 'idle', message: '', interim: '', error: false });
  const session = useRef(null);
  const valuesRef = useRef(values);
  const changeRef = useRef(onChange);
  valuesRef.current = values;
  changeRef.current = onChange;
  useEffect(() => {
    const stopIfHidden = () => { if (document.hidden) session.current?.stop(); };
    document.addEventListener('visibilitychange', stopIfHidden);
    return () => {
      document.removeEventListener('visibilitychange', stopIfHidden);
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
    });
    session.current.start(field, 'en');
  }
  function edit(field, text) {
    session.current?.stopForEdit(field);
    valuesRef.current = { ...valuesRef.current, [field]: text };
    changeRef.current(field, text);
  }
  return { ...state, start, edit, stop: () => session.current?.stop(), active: state.phase !== 'idle' };
}
