import React from "react";

const noteIconPaths = ["M5 3h14v18H5z", "M8 7h8", "M8 11h8", "M8 15h5"];

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {noteIconPaths.map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

export function SavedNoteCard({ row, onOpen }) {
  const items = row.items || [];
  const references = items.map((item) => item.reference || "").filter(Boolean);
  const searchable = `${row.title || "Untitled note"} ${references.join(" ")} ${row.note || ""}`.toLowerCase();

  return (
    <article className="saved-note-card" data-note-searchable={searchable}>
      <button className="saved-note-open" type="button" onClick={() => onOpen(row)}>
        <strong className="saved-note-card-title">{row.title || "Untitled note"}</strong>
        <span className="saved-note-card-heading">
          <NoteIcon />
          <strong>{items.length} verse{items.length === 1 ? "" : "s"}</strong>
        </span>
        <span className="saved-note-references">{references.join(" · ")}</span>
        <p>{row.note || "No preview available"}</p>
      </button>
    </article>
  );
}
