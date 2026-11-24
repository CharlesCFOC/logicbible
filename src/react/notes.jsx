import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDictation } from "./use-dictation.js";
import { VoiceMeter } from "./dictation-controls.jsx";

export function NoteToolbar() {
  const bridge = window.noteEditorBridge;
  const [state, setState] = useState(() => bridge.getSnapshot());
  const [tool, setTool] = useState(null);

  useEffect(() => {
    const handleChange = () => setState(bridge.getSnapshot());
    document.addEventListener("note:toolbar-change", handleChange);
    return () => document.removeEventListener("note:toolbar-change", handleChange);
  }, [bridge]);

  useEffect(() => { document.dispatchEvent(new Event('note:voice-slot-ready')); }, []);

  const command = (name, value) => bridge.command(name, value);

  return (
    <>
      <div className="note-toolbar-group note-voice-group" role="group" aria-label="Voice dictation" data-note-voice-slot />
      <div className="note-toolbar-group note-ai-group" role="group" aria-label="AI tools">
        <button type="button" title="Correct spelling" aria-label="Correct spelling with AI" onClick={() => setTool('correct')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h10M4 9h8M4 13h6M4 17h5m3-1 2.5 2.5L20 13" /></svg></button>
        <button type="button" title="Suggest verses" aria-label="Suggest verses with AI" onClick={() => setTool('verses')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.3 15.3 4.7 4.7" /></svg></button>
      </div>
      <div className="note-toolbar-group" role="group" aria-label="Text style">
      <button type="button" onClick={() => command("bold")} aria-label="Bold"><b>B</b></button>
      <button type="button" onClick={() => command("italic")} aria-label="Italic"><i>I</i></button>
      <button type="button" onClick={() => command("underline")} aria-label="Underline"><u>U</u></button>
      <button type="button" className={state.uppercaseActive ? 'note-uppercase-active' : ''} onPointerDown={(event) => { bridge.captureSelection(); event.preventDefault(); }} onClick={() => bridge.uppercaseSelection()} aria-pressed={state.uppercaseActive} aria-label="Toggle selected text case" title="Toggle selected text case">AA</button>
      </div>
      <div className="note-toolbar-group" role="group" aria-label="Lists">
      <button type="button" onClick={() => command("insertUnorderedList")} aria-label="Bulleted list">•</button>
      <button type="button" onClick={() => command("insertOrderedList")} aria-label="Numbered list">1.</button>
      </div>
      <div className="note-toolbar-group" role="group" aria-label="Text color and size">
      <label className="note-format-select" aria-label="Text color">
        <span className="note-color-letter" style={{ color: state.textColor }} aria-hidden="true">T</span>
        <input type="color" data-note-color value={state.textColor} onChange={(event) => bridge.color("text", event.target.value)} />
      </label>
      <label className="note-format-select" aria-label="Highlight color">
        <span className="note-highlight-letter" style={{ backgroundColor: state.highlightColor }} aria-hidden="true"><span>T</span></span>
        <input type="color" data-note-highlight value={state.highlightColor} onChange={(event) => bridge.color("highlight", event.target.value)} />
      </label>
      <button type="button" onClick={() => bridge.changeSize(-1)} aria-label="Make text smaller" title="Make text smaller">A−</button>
      <button type="button" onClick={() => bridge.changeSize(1)} aria-label="Make text larger" title="Make text larger">A+</button>
      </div>
      <div className="note-toolbar-group" role="group" aria-label="Alignment">
      <button type="button" onClick={() => command("justifyLeft")} aria-label="Align left">≡</button>
      <button type="button" onClick={() => command("justifyCenter")} aria-label="Center">≡</button>
      <button type="button" onClick={() => command("justifyFull")} aria-label="Justify">☰</button>
      </div>
      <div className="note-toolbar-group" role="group" aria-label="PDF">
        <button type="button" title="Preview and export PDF" aria-label="Preview and export PDF" onClick={() => setTool('pdf')}><span className="note-pdf-icon">PDF</span></button>
      </div>
      {tool && createPortal(<NoteToolDialog key={tool} tool={tool} bridge={bridge} onClose={() => setTool(null)} />, document.body)}
    </>
  );
}

function correctionPreview(snapshot, segments) {
  const template = document.createElement('template');
  template.innerHTML = snapshot.safeHtml;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  if (nodes.length !== segments.length) return null;
  nodes.forEach((node, index) => { node.nodeValue = segments[index]; });
  return template.innerHTML;
}

function NoteToolDialog({ tool, bridge, onClose }) {
  const [documentSnapshot] = useState(() => bridge.getDocument());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState([]);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => {
    const handleKey = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function runAi() {
    if (!documentSnapshot.segments.join('').trim()) { setError('Write something in the note first.'); return; }
    setBusy(true); setError('');
    try {
      const response = await bridge.requestAi(tool, documentSnapshot.segments);
      const value = tool === 'verses' ? await bridge.resolveSuggestedVerses(response.verses) : response.segments;
      if (alive.current) { setResult(value); setSelected([]); }
    } catch (err) { if (alive.current) setError(err.message || 'Please try again.'); }
    finally { if (alive.current) setBusy(false); }
  }
  function apply() {
    try {
      if (tool === 'correct') bridge.applyCorrection(documentSnapshot, result);
      else bridge.addSuggestedVerses(documentSnapshot, result.filter(item => selected.includes(item.key)));
      onClose();
    } catch (err) { setError(err.message); }
  }
  async function exportPdf(print) {
    setBusy(true); setError('');
    try {
      const { createNotePdf } = await import('./note-pdf.js');
      const blob = await createNotePdf(documentSnapshot);
      const filename = `${(documentSnapshot.title || 'note').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80)}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (window.Capacitor?.isNativePlatform?.()) {
        if (!navigator.canShare?.({ files: [file] })) throw new Error('PDF export is not supported by this app version. Open the web version to export or print.');
        await navigator.share({ files: [file], title: documentSnapshot.title || 'Note' });
      } else if (print) {
        const url = URL.createObjectURL(blob);
        const frame = document.createElement('iframe');
        frame.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
        frame.onload = () => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch { if (alive.current) setError('Printing is unavailable here. Download the PDF and print it from your device.'); } };
        frame.src = url; document.body.append(frame);
        setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 120000);
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (err) { if (alive.current && err.name !== 'AbortError') setError(err.message || 'Could not create the PDF. Please try again.'); }
    finally { if (alive.current) setBusy(false); }
  }
  const heading = tool === 'correct' ? 'Correct spelling' : tool === 'verses' ? 'Suggest verses' : 'PDF preview';
  return <div className="note-tool-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="note-tool-dialog" role="dialog" aria-modal="true" aria-label={heading}>
      <header><h2>{heading}</h2><button type="button" onClick={onClose} aria-label="Close">×</button></header>
      {tool === 'pdf' ? <div className="note-pdf-preview"><h3>{documentSnapshot.title || 'Note'}</h3><div className="note-pdf-preview-body" dangerouslySetInnerHTML={{ __html: documentSnapshot.safeHtml }} />{documentSnapshot.items.length > 0 && <><h4>Verses</h4>{documentSnapshot.items.map(item => <p key={item.key}><strong>{item.reference}</strong><br />{item.text}</p>)}</>}</div> : <>
        <p className="note-tool-description">{tool === 'correct' ? 'Review the suggested correction before applying it. Formatting is kept.' : 'Choose the verses you want to add to View verses.'}</p>
        {!result && <><p className="note-tool-description">The note text is sent to AI for this request.</p><button type="button" className="note-tool-primary" disabled={busy} onClick={runAi}>{busy ? 'Working…' : tool === 'correct' ? 'Check spelling' : 'Find verses'}</button></>}
        {result && tool === 'correct' && (correctionPreview(documentSnapshot, result) !== null
          ? <div className="note-correction-preview" dangerouslySetInnerHTML={{ __html: correctionPreview(documentSnapshot, result) }} />
          : <div className="note-correction-preview">{result.join('')}</div>)}
        {result && tool === 'verses' && <div className="note-suggestion-list">{result.length ? result.map(item => <label className="note-suggestion" key={item.key}><input type="checkbox" checked={selected.includes(item.key)} onChange={event => setSelected(current => event.target.checked ? [...current, item.key] : current.filter(key => key !== item.key))} /><span><strong>{item.reference} · {item.version}</strong><span>{item.text}</span><small>{item.reason}</small></span></label>) : <p>No verses could be verified in the current Bible version. Try again later.</p>}</div>}
        {result && <div className="note-tool-actions"><button type="button" onClick={onClose}>Cancel</button><button type="button" className="note-tool-primary" disabled={tool === 'verses' && !selected.length} onClick={apply}>{tool === 'correct' ? 'Apply correction' : 'Add selected verses'}</button></div>}
      </>}
      {error && <p className="note-tool-error" role="alert">{error}</p>}
      {tool === 'pdf' && <div className="note-tool-actions"><button type="button" disabled={busy} onClick={() => exportPdf(false)}>{busy ? 'Preparing…' : 'Export PDF'}</button><button type="button" className="note-tool-primary" disabled={busy} onClick={() => exportPdf(true)}>Print PDF</button></div>}
    </section>
  </div>;
}

const noteHeaderIcons = {
  undo: ["M9 14 4 9l5-5", "M4 9h10a6 6 0 0 1 0 12h-2"],
  trash: ["M4 7h16", "M10 11v6", "M14 11v6", "M6 7l1 14h10l1-14", "M9 7V4h6v3"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  chevron: ["m9 6 6 6-6 6"],
};

function NoteHeaderIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {noteHeaderIcons[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

function useNoteEditorState() {
  const bridge = window.noteEditorBridge;
  const [state, setState] = useState(() => bridge.getEditorSnapshot());

  useEffect(() => {
    const handleChange = () => setState(bridge.getEditorSnapshot());
    document.addEventListener("note:editor-change", handleChange);
    return () => document.removeEventListener("note:editor-change", handleChange);
  }, [bridge]);

  return [state, bridge];
}

export function NoteEditorHeader() {
  const [state, bridge] = useNoteEditorState();
  return (
    <>
      <div>
        <span>Notes</span>
        <input className="note-editor-title note-editor-heading-title" value={state.title} onChange={(event) => bridge.setTitle(event.target.value)} type="text" maxLength="100" placeholder="Note title" aria-label="Note title" />
      </div>
      <div className="note-editor-header-actions">
        <button type="button" className="note-undo-button" onClick={() => bridge.command("undo")} aria-label="Undo" title="Undo"><NoteHeaderIcon name="undo" /></button>
        <button type="button" className="note-delete-button" onClick={bridge.delete} aria-label="Delete note" title="Delete note"><NoteHeaderIcon name="trash" /></button>
        <button type="button" className="note-close-button" onClick={bridge.close} aria-label="Close note editor" title="Close"><NoteHeaderIcon name="close" /></button>
      </div>
    </>
  );
}

export function NoteEditorVerseChips() {
  const [state, bridge] = useNoteEditorState();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button type="button" className="note-editor-verse-summary" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
        <span className="note-editor-verse-summary-copy"><strong>View verses</strong></span>
        <NoteHeaderIcon name="chevron" />
      </button>
      {expanded && (
        <div className="note-editor-verse-menu">
          <button type="button" className="note-editor-add-verse" onClick={bridge.startAdding}><span aria-hidden="true">+</span> Add verse</button>
          {state.items.length
            ? state.items.map((item) => (
              <article className="note-editor-verse-item" key={item.key}>
                <div className="note-editor-verse-item-heading">
                  <strong>{item.reference}</strong>
                  <button type="button" onClick={() => bridge.removeVerse(item.key)} aria-label={`Remove ${item.reference} from note`}>×</button>
                </div>
                <p>{item.text || "Verse text unavailable."}</p>
              </article>
            ))
            : <span className="note-editor-no-verses">No verses attached</span>}
        </div>
      )}
    </>
  );
}

export function NoteEditorContent() {
  const bridge = window.noteEditorBridge;
  const contentRef = useRef(null);
  const inserting = useRef(false);
  const [voiceSlot, setVoiceSlot] = useState(null);
  const [dictationError, setDictationError] = useState('');
  const dictation = useDictation({ values: { note: '' }, onChange: (_field, text) => {
    inserting.current = true;
    try { if (!bridge.insertDictation(text)) setDictationError('The note changed before transcription finished. Please try again.'); }
    finally { inserting.current = false; }
  }, recorded: true, silenceTimeoutMs: 2500, maxLength: 6000 });
  const dictationRef = useRef(dictation);
  dictationRef.current = dictation;

  useEffect(() => {
    const cancel = () => dictationRef.current.cancel('note');
    document.addEventListener('note:closed', cancel);
    return () => document.removeEventListener('note:closed', cancel);
  }, []);

  useEffect(() => {
    const findSlot = () => setVoiceSlot(document.querySelector('[data-note-voice-slot]'));
    findSlot();
    document.addEventListener('note:voice-slot-ready', findSlot);
    return () => document.removeEventListener('note:voice-slot-ready', findSlot);
  }, []);

  useEffect(() => {
    bridge.attachContent(contentRef.current);
    const syncContent = () => {
      const element = contentRef.current;
      const html = bridge.getContentHtml();
      if (element && html && element.innerHTML !== html && document.activeElement !== element) {
        element.innerHTML = html;
      }
    };
    document.addEventListener("note:editor-change", syncContent);
    syncContent();
    return () => {
      document.removeEventListener("note:editor-change", syncContent);
      bridge.attachContent(null);
    };
  }, [bridge]);

  const listening = ['starting', 'listening'].includes(dictation.phase);
  const finishing = dictation.phase === 'finishing';
  return <>
    <div className={`note-dictation-row${listening ? ' is-visible' : ''}`}>
      {listening && <VoiceMeter active={dictation.phase === 'listening'} dictation={dictation} bibleStyle />}
    </div>
    {voiceSlot && createPortal(<button type="button" className={`note-dictation-button${listening ? ' is-listening' : ''}`} aria-label={listening ? 'Stop dictation' : 'Dictate note'} title={listening ? 'Stop dictation' : 'Dictate note'} aria-pressed={listening} disabled={finishing} onPointerDown={event => { if (!dictation.active) { bridge.captureDictationTarget(); event.preventDefault(); } }} onClick={() => { setDictationError(''); if (listening) dictation.stop(); else if (!dictation.active) { if (bridge.captureDictationTarget()) dictation.start('note'); } }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{listening ? <rect x="6" y="6" width="12" height="12" rx="2" /> : <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>}</svg>
      </button>, voiceSlot)}
    <p className="note-dictation-status" role="status">{dictationError || dictation.message}</p>
    <div ref={contentRef} className="note-editor-content" data-note-editor-content contentEditable suppressContentEditableWarning role="textbox" aria-label="Write your note" onInput={(event) => { if (!inserting.current) dictation.cancel('note'); bridge.contentChanged(event.currentTarget.innerHTML); }} onMouseUp={() => bridge.captureSelection()} onKeyUp={() => bridge.captureSelection()} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z' && bridge.undoUppercase()) event.preventDefault(); }} />
  </>;
}
