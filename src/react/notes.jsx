import React, { useEffect, useState } from "react";

const noteToolbarIcons = {
  text: ["M4 5h16", "M12 5v14", "M8 19h8"],
  highlight: ["M4 16 14 6l4 4L8 20H4z", "m14 6 2-2 4 4-2 2"],
};

function NoteToolbarIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {noteToolbarIcons[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

export function NoteToolbar() {
  const bridge = window.noteEditorBridge;
  const [state, setState] = useState(() => bridge.getSnapshot());

  useEffect(() => {
    const handleChange = () => setState(bridge.getSnapshot());
    document.addEventListener("note:toolbar-change", handleChange);
    return () => document.removeEventListener("note:toolbar-change", handleChange);
  }, [bridge]);

  const command = (name, value) => bridge.command(name, value);

  return (
    <>
      <button type="button" onClick={() => command("bold")} aria-label="Bold"><b>B</b></button>
      <button type="button" onClick={() => command("italic")} aria-label="Italic"><i>I</i></button>
      <button type="button" onClick={() => command("underline")} aria-label="Underline"><u>U</u></button>
      <button type="button" onClick={() => command("formatBlock", "h2")} aria-label="Title">H</button>
      <span className="note-toolbar-divider" aria-hidden="true"></span>
      <button type="button" onClick={() => command("insertUnorderedList")} aria-label="Bulleted list">•</button>
      <button type="button" onClick={() => command("insertOrderedList")} aria-label="Numbered list">1.</button>
      <span className="note-toolbar-divider" aria-hidden="true"></span>
      <label className="note-format-select" aria-label="Text color">
        <NoteToolbarIcon name="text" />
        <span className="note-color-swatch" style={{ background: state.textColor }}></span>
        <input type="color" value={state.textColor} onChange={(event) => bridge.color("text", event.target.value)} />
      </label>
      <label className="note-format-select" aria-label="Highlight color">
        <NoteToolbarIcon name="highlight" />
        <span className="note-color-swatch" style={{ background: state.highlightColor }}></span>
        <input type="color" value={state.highlightColor} onChange={(event) => bridge.color("highlight", event.target.value)} />
      </label>
      <button type="button" onClick={() => bridge.changeSize(-1)} aria-label="Make text smaller" title="Make text smaller">A−</button>
      <button type="button" onClick={() => bridge.changeSize(1)} aria-label="Make text larger" title="Make text larger">A+</button>
      <span className="note-toolbar-divider" aria-hidden="true"></span>
      <button type="button" onClick={() => command("justifyLeft")} aria-label="Align left">≡</button>
      <button type="button" onClick={() => command("justifyCenter")} aria-label="Center">≡</button>
      <button type="button" onClick={() => command("justifyFull")} aria-label="Justify">☰</button>
    </>
  );
}

const noteHeaderIcons = {
  undo: ["M9 14 4 9l5-5", "M4 9h10a6 6 0 0 1 0 12h-2"],
  trash: ["M4 7h16", "M10 11v6", "M14 11v6", "M6 7l1 14h10l1-14", "M9 7V4h6v3"],
  save: ["M5 4h12l3 3v13H5z", "M8 4v6h8V4", "M8 20v-6h8v6"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  chevron: ["m6 9 6 6 6-6"],
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
        <button type="button" className="primary-button note-save-button" data-save-rich-note onClick={bridge.save} aria-label="Save note" title="Save note"><NoteHeaderIcon name="save" /></button>
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
        <span className="note-editor-verse-summary-copy"><strong>Voir les versets</strong></span>
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

  return <div ref={contentRef} className="note-editor-content" data-note-editor-content contentEditable suppressContentEditableWarning role="textbox" aria-label="Write your note" onInput={(event) => bridge.contentChanged(event.currentTarget.innerHTML)} />;
}
