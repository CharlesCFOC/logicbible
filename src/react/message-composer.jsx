import React, { useEffect, useId, useRef } from "react";
import { DictationControls } from "./dictation-controls.jsx";

// Field only: the owning page supplies the form and its submission rules.
// Prayer, Debate and Brother AI share this markup and components/message-composer.css.
export function MessageComposer({ value, onChange, placeholder, ariaLabel, id, disabled = false, required = false, maxLength, submitLabel = "Send message", dictation = null, dictationField = "message", placeholderFading = false }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 180 ? "auto" : "hidden";
  }, [value]);

  const input = <textarea
    id={fieldId}
    ref={textareaRef}
    className={placeholderFading ? "is-placeholder-fading" : undefined}
    value={value}
    onChange={event => dictation ? dictation.edit(dictationField, event.target.value) : onChange(event.target.value)}
    rows={1}
    maxLength={maxLength}
    required={required}
    placeholder={placeholder}
    aria-label={ariaLabel}
    aria-describedby={dictation ? `${fieldId}-dictation-status` : undefined}
    disabled={disabled}
  />;

  return <div className="message-composer">
    {dictation ? <DictationControls field={dictationField} fieldId={fieldId} label={ariaLabel} dictation={dictation} disabled={disabled} showReadAloud={false}>{input}</DictationControls> : input}
    <button className="message-composer-send" type="submit" aria-label={submitLabel} title={submitLabel} disabled={disabled || Boolean(dictation?.active)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
    </button>
  </div>;
}
