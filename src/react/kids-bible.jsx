import React, { useEffect, useRef, useState } from "react";

const kidsBibleIcons = {
  arrowLeft: ["M19 12H5", "m12 19-7-7 7-7"],
  arrowUpRight: ["M5 19 19 5", "M9 5h10v10"],
  home: ["M3 10.5 12 3l9 7.5", "M5 9.5V21h14V9.5", "M9 21v-6h6v6"],
  chevronLeft: ["m15 18-6-6 6-6"],
  chevronRight: ["m9 18 6-6-6-6"],
};

function KidsBibleIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {kidsBibleIcons[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

function KidsBibleLibrary({ snapshot, onOpen }) {
  return (
    <div className="kids-bible-library">
      <div className="kids-bible-section-heading">
        <h2>Choose a book</h2>
        <span>3 stories</span>
      </div>
      {snapshot.books.map((book) => (
        <button className="kids-book-card" type="button" key={book.id} onClick={() => onOpen(book.id)}>
          <img src={book.previewSrc} alt={`${book.title} comic preview`} loading="lazy" decoding="async" />
          <div className="kids-book-card-copy">
            <strong>{book.title}</strong>
            <small>Page {book.page} of {book.totalPages} · {book.progress}%</small>
            <div className="kids-book-progress" role="progressbar" aria-label={`${book.title} reading progress`} aria-valuemin="1" aria-valuemax={book.totalPages} aria-valuenow={book.page}>
              <span style={{ width: `${book.progress}%` }} />
            </div>
          </div>
          <KidsBibleIcon name="arrowUpRight" />
        </button>
      ))}
    </div>
  );
}

function KidsBibleReader({ snapshot, onBack, onPage, onChangePage }) {
  const swipeStart = useRef(null);
  const book = snapshot.currentBook;

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event) => {
    if (!swipeStart.current) return;
    const touch = event.changedTouches[0];
    const deltaX = (touch?.clientX || 0) - swipeStart.current.x;
    const deltaY = (touch?.clientY || 0) - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    onChangePage(deltaX < 0 ? 1 : -1);
  };

  return (
    <section className="kids-bible-reader" aria-label="Kids Bible reader">
      <header className="kids-reader-topbar">
        <button type="button" onClick={onBack} aria-label="Back to Kids Bible books"><KidsBibleIcon name="arrowLeft" /></button>
        <div>
          <span>Kids Bible</span>
          <strong>{book.title}</strong>
        </div>
        <div className="kids-reader-page-tools">
          <label>
            <span className="sr-only">Page</span>
            <select value={snapshot.page} onChange={(event) => onPage(Number(event.target.value))} aria-label="Choose page">
              {Array.from({ length: book.totalPages }, (_, index) => <option value={index + 1} key={index + 1}>Page {index + 1}</option>)}
            </select>
          </label>
          <span>{snapshot.page} / {book.totalPages}</span>
        </div>
      </header>
      <div className="kids-reader-progress" aria-hidden="true"><span style={{ width: `${snapshot.progress}%` }} /></div>
      <div className="kids-reader-image-wrap" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <img src={snapshot.imageSrc} alt={`${book.title} illustrated page ${snapshot.page}`} loading="lazy" decoding="async" />
      </div>
      <button className="kids-reader-first-page" type="button" onClick={() => onPage(1)} aria-label="Go to first page"><KidsBibleIcon name="home" /></button>
      <button className="kids-reader-arrow is-previous" type="button" onClick={() => onChangePage(-1)} aria-label="Previous page"><KidsBibleIcon name="chevronLeft" /></button>
      <button className="kids-reader-arrow is-next" type="button" onClick={() => onChangePage(1)} aria-label="Next page"><KidsBibleIcon name="chevronRight" /></button>
    </section>
  );
}

export function KidsBiblePage() {
  const bridge = window.kidsBibleBridge;
  const [snapshot, setSnapshot] = useState(bridge.getSnapshot());

  useEffect(() => {
    const handleChange = () => setSnapshot(bridge.getSnapshot());
    window.addEventListener("kids-bible:state-change", handleChange);
    return () => window.removeEventListener("kids-bible:state-change", handleChange);
  }, [bridge]);

  const openBook = (bookId) => bridge.open(bookId);
  const closeReader = () => bridge.close();
  const setPage = (page) => bridge.setPage(page);
  const changePage = (delta) => bridge.changePage(delta);

  return (
    <>
      <header className="kids-bible-header">
        <div>
          <span className="eyebrow">For curious hearts</span>
          <h1>Kids Bible</h1>
        </div>
      </header>
      {snapshot.reader ? <KidsBibleReader snapshot={snapshot} onBack={closeReader} onPage={setPage} onChangePage={changePage} /> : <KidsBibleLibrary snapshot={snapshot} onOpen={openBook} />}
    </>
  );
}
