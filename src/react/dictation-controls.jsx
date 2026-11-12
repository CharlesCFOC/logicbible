import React, { useEffect, useRef, useState } from 'react';
import { startVoiceMeter } from '../shared/voice-meter.js';
import { ReadAloudButton } from './read-aloud.jsx';

function VoiceMeter({ active }) {
  const canvasRef = useRef(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const drawing = canvas?.getContext('2d');
    if (!drawing) return;
    setUnavailable(false);
    const gradient = drawing.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#a855f7');
    gradient.addColorStop(1, '#e879f9');
    return startVoiceMeter({
      getStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      createContext: () => new (window.AudioContext || window.webkitAudioContext)(),
      requestFrame: callback => window.requestAnimationFrame(callback),
      cancelFrame: id => window.cancelAnimationFrame(id),
      onLevels: levels => {
        drawing.clearRect(0, 0, canvas.width, canvas.height);
        drawing.fillStyle = gradient;
        levels.forEach((level, index) => {
          const height = Math.max(4, level * canvas.height);
          drawing.beginPath();
          drawing.roundRect(index * 12, (canvas.height - height) / 2, 8, height, 4);
          drawing.fill();
        });
      },
      onUnavailable: () => setUnavailable(true),
    });
  }, [active]);
  return <div className="church-voice-meter" hidden={unavailable} aria-hidden="true"><canvas ref={canvasRef} width="216" height="56" /></div>;
}

export function DictationControls({ field, fieldId, label, dictation, disabled = false, children }) {
  const selected = dictation.field === field;
  const listening = selected && ['starting', 'listening'].includes(dictation.phase);
  const finishing = selected && dictation.phase === 'finishing';
  const statusId = `${fieldId}-dictation-status`;
  const actionLabel = `${listening ? 'Stop dictation' : finishing ? 'Finishing transcription' : 'Dictate'}: ${label}`;
  return <div className={`church-dictation${listening ? ' is-listening' : ''}`}>
    <div className="church-dictation-input">
      {children}
      {listening && <VoiceMeter active={dictation.phase === 'listening'} />}
      <button type="button" className="church-dictation-button" disabled={disabled || finishing || (dictation.active && !selected)} onClick={() => listening ? dictation.stop() : dictation.start(field)} aria-label={actionLabel} title={actionLabel} aria-pressed={listening} aria-controls={fieldId} aria-describedby={statusId}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{listening ? <rect x="6" y="6" width="12" height="12" rx="2" /> : <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>}</svg>
      </button>
    </div>
    <ReadAloudButton text={children.props.value} label={label} disabled={disabled || dictation.active} />
    {listening && <div className="church-dictation-toolbar"><span className="church-dictation-indicator" aria-hidden="true"><i />Microphone on</span></div>}
    <p id={statusId} className={`church-dictation-status${selected && dictation.error ? ' is-error' : ''}`} role="status" hidden={!selected || !dictation.message}>{selected ? dictation.message : ''}</p>
  </div>;
}
