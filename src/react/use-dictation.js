import { useEffect, useRef, useState } from 'react';
import { createDictationSession } from '../shared/speech-dictation.js';
import { stopReadAloud } from './read-aloud.jsx';
import { createRecordedDictationSession } from '../shared/recorded-dictation.js';
import { startBibleVoiceRecorder } from '../shared/bible-voice-recorder.js';
import { requestBibleVoiceTranscript } from './bible-voice-client.js';

export function useDictation({ values, onChange, language = 'en', maxLength = 1200, silenceTimeoutMs = 0, recorded = false }) {
  const [state, setState] = useState({ field: null, phase: 'idle', message: '', interim: '', error: false });
  const [levels, setLevels] = useState(Array(18).fill(0));
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
    const shared = {
      getText: key => valuesRef.current[key],
      writeText: (key, text) => {
        valuesRef.current = { ...valuesRef.current, [key]: text };
        changeRef.current(key, text);
      },
      onState: setState,
      maxLength,
    };
    if (!session.current && recorded) session.current = createRecordedDictationSession({
      ...shared,
      transcribe: requestBibleVoiceTranscript,
      onLevels: setLevels,
      createRecorder: callbacks => {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder || !(window.AudioContext || window.webkitAudioContext)) throw new Error('Audio recording is not available on this device.');
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(type => window.MediaRecorder.isTypeSupported?.(type));
        return startBibleVoiceRecorder({
          ...callbacks,
          getStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
          createRecorder: stream => mimeType ? new window.MediaRecorder(stream, { mimeType }) : new window.MediaRecorder(stream),
          createAudioContext: () => new (window.AudioContext || window.webkitAudioContext)(),
          requestFrame: callback => window.requestAnimationFrame(callback),
          cancelFrame: id => window.cancelAnimationFrame(id),
          silenceMs: silenceTimeoutMs || 2500,
          maxDurationMs: 60_000,
        });
      },
    });
    if (!session.current) session.current = createDictationSession({
      ...shared,
      createRecognition: () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        return Recognition ? new Recognition() : null;
      },
      silenceTimeoutMs,
    });
    session.current.start(field, language);
  }
  function edit(field, text) {
    session.current?.stopForEdit(field);
    valuesRef.current = { ...valuesRef.current, [field]: text };
    changeRef.current(field, text);
  }
  return { ...state, start, edit, stop: () => session.current?.stop(), cancel: field => session.current?.stopForEdit(field), setAudioMonitoring: enabled => session.current?.setAudioMonitoring?.(enabled), audioLevel: level => session.current?.audioLevel?.(level), recorded, levels, active: state.phase !== 'idle' };
}
