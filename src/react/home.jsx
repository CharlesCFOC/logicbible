import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const arrowIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19 19 5" />
    <path d="M9 5h10v10" />
  </svg>
);

function readInitialStats() {
  return {
    streak: document.querySelector("[data-home-streak]")?.textContent?.trim() || "1 day",
    peopleOnline: document.querySelector("[data-people-online]")?.textContent?.trim() || "128",
    continueReading: document.querySelector("[data-home-continue-reading]")?.textContent?.trim() || "John 15",
    prayerCount: document.querySelector("[data-home-prayer-count]")?.textContent?.trim() || "0",
  };
}

const handHeartIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z" />
    <path d="M7 15h4l2-3 2 2h3" />
  </svg>
);

const libraryIcons = {
  highlights: ["M4 20 15.5 8.5", "m14 5 5 5", "M4 20h4l11-11-4-4L4 16z"],
  bookmarks: ["M6 4.5A2.5 2.5 0 0 1 8.5 2H18v19l-6-3-6 3z"],
  notes: ["M5 3h14v18H5z", "M8 7h8", "M8 11h8", "M8 15h5"],
};

function LibraryIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {libraryIcons[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

export function HomeHero() {
  return (
    <>
      <img src="assets/home-card-forest.webp" alt="A peaceful natural forest landscape" />
      <div className="home-hero-image-copy">
        <div className="home-hero-verse">
          <span>Verse of the day</span>
          <strong>“The Lord is my shepherd; I shall not want.”</strong>
          <small>Psalm 23:1</small>
        </div>
        <button type="button" data-nav="bible">
          Start reading {arrowIcon}
        </button>
      </div>
    </>
  );
}

export function HomeStats() {
  const [stats, setStats] = useState(readInitialStats);

  useEffect(() => {
    const handleStatsChange = (event) => {
      if (!event.detail) return;
      setStats((current) => ({ ...current, ...event.detail }));
    };
    window.addEventListener("home:stats-change", handleStatsChange);
    return () => window.removeEventListener("home:stats-change", handleStatsChange);
  }, []);

  return (
    <>
      <article className="home-stat-card">
        <span>Connected streak</span>
        <strong>{stats.streak}</strong>
      </article>
      <article className="home-stat-card home-stat-card--online">
        <span>People online</span>
        <strong>{stats.peopleOnline}</strong>
      </article>
      <button className="home-stat-card home-stat-card--continue" type="button" data-nav="bible">
        <span>Continue reading</span>
        <strong>{stats.continueReading}</strong>
        {arrowIcon}
      </button>
    </>
  );
}

function readTimelineItems() {
  return [...document.querySelectorAll("[data-home-era-book]")].map((button) => ({
    id: button.dataset.homeEraBook,
    label: button.querySelector("span")?.textContent?.trim() || "",
    details: (button.querySelector("strong")?.textContent || "")
      .split("·")
      .map((item) => item.trim())
      .filter(Boolean),
    title: button.title || "",
  }));
}

export function HomeBibleTimeline() {
  const items = readTimelineItems();
  return (
    <div className="home-bible-timeline-track">
      {items.map((item) => (
        <button key={item.id} type="button" title={item.title} onClick={() => window.homeTimelineBridge?.open(item.id)}>
          <span>{item.label}</span>
          <strong>{item.details.map((detail) => <span className="timeline-detail-item" key={detail}>{detail}</span>)}</strong>
        </button>
      ))}
    </div>
  );
}

export function HomePrayerCard() {
  const [prayerCount, setPrayerCount] = useState(() => readInitialStats().prayerCount);

  useEffect(() => {
    const handleStatsChange = (event) => {
      if (event.detail?.prayerCount === undefined) return;
      setPrayerCount(event.detail.prayerCount);
    };
    window.addEventListener("home:stats-change", handleStatsChange);
    return () => window.removeEventListener("home:stats-change", handleStatsChange);
  }, []);

  return (
    <>
      <span className="home-prayer-card-icon">{handHeartIcon}</span>
      <span>
        <small>Prayer requests</small>
        <strong><span>{prayerCount}</span> people are waiting for prayer</strong>
      </span>
      {arrowIcon}
    </>
  );
}

export function HomeLibraryTabs() {
  const [activeTab, setActiveTab] = useState(() => (
    document.querySelector("[data-home-library-tab].is-active")?.dataset.homeLibraryTab || "notes"
  ));

  useEffect(() => {
    const handleTabChange = (event) => {
      if (event.detail?.tab) setActiveTab(event.detail.tab);
    };
    document.addEventListener("home:library-tab-active", handleTabChange);
    return () => document.removeEventListener("home:library-tab-active", handleTabChange);
  }, []);

  const selectTab = (tab, event) => {
    if (event?.nativeEvent?.__primaryTabHandled) return;
    setActiveTab(tab);
    if (typeof window.homeLibraryBridge?.selectTab === "function") {
      window.homeLibraryBridge.selectTab(tab);
      return;
    }
    document.dispatchEvent(new CustomEvent("home:library-tab-change", { detail: { tab } }));
  };

  return [
    ["highlights", "Highlight"],
    ["bookmarks", "Bookmark"],
    ["notes", "Notes"],
  ].map(([id, label]) => (
    <button
      className={activeTab === id ? "is-active" : ""}
      key={id}
      type="button"
      data-home-library-tab={id}
      onClick={(event) => selectTab(id, event)}
    >
      <LibraryIcon name={id} />
      <span>{label}</span>
    </button>
  ));
}

const folderIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
  </svg>
);

const sparkleIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.3 5.7L5 10l5.7 1.3L12 17l1.3-5.7L19 10l-5.7-1.3z" />
    <path d="m5 17-.6 2.4L2 20l2.4.6L5 23l.6-2.4L8 20l-2.4-.6z" />
  </svg>
);

function HomeLibraryFolderTools({ snapshot, tab, onChange }) {
  const [folderName, setFolderName] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  if (tab === "notes") return null;

  const createFolder = (event) => {
    event.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    const folderId = window.homeLibraryBridge.createFolder(tab, name);
    setFolderName("");
    setCreateOpen(false);
    if (folderId) onChange(folderId);
  };

  const openCreateFolder = () => {
    setEditingFolder(null);
    setFolderName("");
    setCreateOpen(true);
  };

  const openRenameFolder = (folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
  };

  const renameFolder = (event) => {
    event.preventDefault();
    const name = folderName.trim();
    if (!editingFolder || !name) return;
    if (!window.homeLibraryBridge.renameFolder(tab, editingFolder.id, name)) return;
    setEditingFolder(null);
    setFolderName("");
    onChange(snapshot.activeFolder);
  };

  const deleteFolder = (folder) => {
    if (!window.confirm(`Delete the folder “${folder.name}”? Saved items will move to No folder.`)) return;
    const deleted = window.homeLibraryBridge.deleteFolder(tab, folder.id);
    if (!deleted) return;
    const nextFolder = snapshot.activeFolder === folder.id ? "" : snapshot.activeFolder;
    setEditingFolder(null);
    onChange(nextFolder);
  };

  return (
    <div className="saved-folder-tools">
      <button className="saved-folder-create-trigger" type="button" onClick={openCreateFolder} aria-label="New folder" title="New folder">+</button>
      <div className="saved-folder-chips" aria-label={`${tab} folders`}>
        <button className={snapshot.activeFolder === "" ? "is-active" : ""} type="button" onClick={() => onChange("")}>All</button>
        <button className={snapshot.activeFolder === "unfiled" ? "is-active" : ""} type="button" onClick={() => onChange("unfiled")}>No folder</button>
        {snapshot.folders.map((folder) => (
          <button className={snapshot.activeFolder === folder.id ? "is-active" : ""} key={folder.id} type="button" onClick={() => onChange(folder.id)}>{folder.name}</button>
        ))}
      </div>
      {isCreateOpen && createPortal(
        <div className="saved-folder-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCreateOpen(false)}>
          <form className="saved-folder-popover saved-folder-create-popover" onSubmit={editingFolder ? renameFolder : createFolder} role="dialog" aria-modal="true" aria-labelledby="new-folder-title">
            <div className="saved-folder-create-heading">
              <div><span>Organize your library</span><h3 id="new-folder-title">{editingFolder ? "Rename folder" : "New folder"}</h3></div>
              <button type="button" className="saved-folder-create-close" onClick={() => setCreateOpen(false)} aria-label="Close">×</button>
            </div>
            <p>{editingFolder ? "Update the name of this folder." : `Give your ${tab === "highlights" ? "highlights" : "bookmarks"} a place to call home.`}</p>
            <input autoFocus value={folderName} onChange={(event) => setFolderName(event.target.value)} type="text" name="folder" placeholder="Folder name" aria-label="Folder name" maxLength="40" />
            <div className="saved-folder-create-actions">
              <button type="button" onClick={() => { setEditingFolder(null); setFolderName(""); setCreateOpen(false); }}>Cancel</button>
              <button type="submit">{editingFolder ? "Save changes" : "Create folder"}</button>
            </div>
            {!editingFolder && snapshot.folders.length > 0 && (
              <div className="saved-folder-management-list">
                <span>Existing folders</span>
                {snapshot.folders.map((folder) => (
                  <div className="saved-folder-management-row" key={folder.id}>
                    <strong>{folder.name}</strong>
                    <button type="button" onClick={() => openRenameFolder(folder)}>Rename</button>
                    <button type="button" className="saved-folder-delete" onClick={() => deleteFolder(folder)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>,
        document.body,
      )}
    </div>
  );
}

function HomeSavedVerseRow({ row, tab, onOpen }) {
  return (
    <article className="saved-verse-row">
      <button className="saved-verse-open" type="button" onClick={() => onOpen(row)}>
        {tab === "highlights" ? (
          <span className="saved-color-dot" style={{ "--saved-color": row.colorValue || "var(--beige)" }} aria-hidden="true" />
        ) : <LibraryIcon name="bookmarks" />}
        <span>
          <strong>{row.reference || `${row.bookId} ${row.chapter}:${row.number}`}</strong>
          <small>{row.version || ""}</small>
          <p>{row.text || ""}</p>
        </span>
      </button>
      <button
        className="saved-folder-trigger"
        type="button"
        data-saved-folder-trigger
        data-saved-folder-type={tab}
        data-saved-folder-key={row.storageKey}
        data-saved-folder-current={row.folderId || ""}
        aria-label="Choose folder"
        title="Choose folder"
      >
        {folderIcon}
      </button>
    </article>
  );
}

function HomeSavedNoteCard({ row, onOpen }) {
  return (
    <article className="saved-note-card">
      <button className="saved-note-open" type="button" onClick={() => onOpen(row)}>
        <strong className="saved-note-card-title">{row.title || "Untitled note"}</strong>
        <span className="saved-note-card-heading">
          <LibraryIcon name="notes" />
          <strong>{row.items.length} verse{row.items.length === 1 ? "" : "s"}</strong>
        </span>
        <span className="saved-note-references">{row.items.map((item) => item.reference || "").join(" · ")}</span>
        <p>{row.note || "No preview available"}</p>
      </button>
    </article>
  );
}

export function HomeLibraryPanel() {
  const bridge = window.homeLibraryBridge;
  const initialTab = document.querySelector("[data-home-library-panel]")?.dataset.homeLibraryView || "notes";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [snapshot, setSnapshot] = useState(() => bridge.getSnapshot(initialTab));
  const [search, setSearch] = useState("");

  useEffect(() => {
    const refresh = (event) => {
      const nextTab = event.detail?.tab || activeTab;
      setActiveTab(nextTab);
      setSnapshot(bridge.getSnapshot(nextTab));
      if (nextTab !== "notes") setSearch("");
    };
    document.addEventListener("home:library-tab-active", refresh);
    document.addEventListener("home:library-data-change", refresh);
    return () => {
      document.removeEventListener("home:library-tab-active", refresh);
      document.removeEventListener("home:library-data-change", refresh);
    };
  }, [activeTab, bridge]);

  const changeFolder = (folderId) => {
    bridge.setFolder(activeTab, folderId);
  };

  const visibleRows = activeTab === "notes" && search.trim()
    ? snapshot.rows.filter((row) => `${row.title || "Untitled note"} ${row.items.map((item) => item.reference || "").join(" ")} ${row.note || ""}`.toLowerCase().includes(search.trim().toLowerCase()))
    : snapshot.rows;
  const hasContent = snapshot.rows.length > 0 || snapshot.aiRows.length > 0;

  if (!hasContent) {
    const connected = snapshot.isConnected;
    return (
      <div className="home-library-empty-state">
        <LibraryIcon name="notes" />
        <strong>{connected ? "Your library is empty" : "Sign in to see more"}</strong>
        <p>{connected ? "Save highlights, bookmarks and notes from the Bible tab to find them here." : "Sign in to sync your notes, bookmarks and highlights across your devices."}</p>
        <button type="button" data-nav={connected ? "bible" : "profile"}>
          {connected ? "Start reading" : "Sign in or create an account"} {arrowIcon}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="saved-panel-title">
        <h3>{activeTab === "notes" ? "Notes" : activeTab === "highlights" ? "Highlights" : "Bookmarks"}</h3>
        <span>{snapshot.totalRows}</span>
      </div>
      {activeTab === "notes" && (
        <label className="saved-notes-search">
          <LibraryIcon name="notes" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search notes..." aria-label="Search notes" />
        </label>
      )}
      <HomeLibraryFolderTools snapshot={snapshot} tab={activeTab} onChange={changeFolder} />
      {visibleRows.length || snapshot.aiRows.length ? (
        <>
          {activeTab === "notes"
            ? visibleRows.map((row) => <HomeSavedNoteCard key={row.id} row={row} onOpen={bridge.openSavedNote} />)
            : visibleRows.map((row) => <HomeSavedVerseRow key={row.storageKey} row={row} tab={activeTab} onOpen={bridge.openSavedVerse} />)}
          {snapshot.aiRows.map((row) => (
            <article className="saved-ai-row" key={row.id}>
              <div className="saved-ai-row-heading">{sparkleIcon}<strong>AI response</strong></div>
              <p>{row.text || ""}</p>
              <button className="saved-folder-trigger" type="button" data-saved-folder-trigger data-saved-folder-type="ai-bookmarks" data-saved-folder-key={row.id} data-saved-folder-current={row.folderId || ""} aria-label="Choose folder" title="Choose folder">
                {folderIcon}
              </button>
            </article>
          ))}
        </>
      ) : (
        <p className="saved-empty">{snapshot.activeFolder ? `No saved verses in ${snapshot.folders.find((folder) => folder.id === snapshot.activeFolder)?.name || "this folder"} yet.` : activeTab === "notes" ? "No notes match your search." : `No ${activeTab} yet.`}</p>
      )}
    </>
  );
}
