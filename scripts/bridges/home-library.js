// Adapter used by React; installed at the original bootstrap point.
function installHomeLibraryBridge() {
window.homeLibraryBridge = {
  searchVoiceItems(kind, query, reference) {
    if (!['notes', 'bookmarks'].includes(kind)) return [];
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const terms = normalize(query).split(/[^a-z0-9]+/).filter(Boolean);
    const candidates = kind === 'notes'
      ? getSavedNoteRows().map(row => ({ kind: 'notes', key: row.id, label: row.title || row.items.map(item => item.reference).filter(Boolean).join(' · ') || 'Note', text: `${row.title || ''} ${row.note || ''} ${row.items.map(item => item.reference || '').join(' ')}`, verses: row.items }))
      : [
        ...getSavedRows('bookmarks', '').map(row => ({ kind: 'bookmarks', key: row.storageKey, label: row.reference || `${row.bookId} ${row.chapter}:${row.number}`, text: `${row.reference || ''} ${row.text || ''}`, verses: [row] })),
        ...Object.values(savedState.aiBookmarks).map(row => ({ kind: 'ai-bookmark', key: row.id, label: `Brother AI · ${String(row.text || '').slice(0, 70)}`, text: row.text || '', verses: [] })),
      ];
    return candidates.filter(item => reference
      ? item.verses.some(verse => verse.bookId === reference.bookId && Number(verse.chapter) === reference.chapter && Number(verse.number) === reference.verse)
      : terms.every(term => normalize(item.text).includes(term)))
      .slice(0, 5).map(({ kind: itemKind, key, label }) => ({ kind: itemKind, key, label }));
  },
  async openVoiceItem(item) {
    if (item.kind === 'notes') {
      const note = getSavedNoteRows().find(row => row.id === item.key);
      if (!note) throw new Error('Cette note n’est plus disponible.');
      await openSavedNote(note);
      return;
    }
    if (item.kind === 'bookmarks') {
      const bookmark = getSavedRows('bookmarks', '').find(row => row.storageKey === item.key);
      if (!bookmark) throw new Error('Ce favori n’est plus disponible.');
      await openSavedVerse(bookmark);
      return;
    }
    if (item.kind === 'ai-bookmark' && savedState.aiBookmarks[item.key]) {
      setScreen('home');
      if (appShell.dataset.activeScreen !== 'home') throw new Error('La page des favoris n’a pas pu s’ouvrir.');
      activeProfileFolders.bookmarks = '';
      renderHomeLibraryTab('bookmarks');
      document.dispatchEvent(new CustomEvent('home:voice-ai-bookmark', { detail: { id: item.key } }));
      return;
    }
    throw new Error('Ce favori n’est plus disponible.');
  },
  selectTab(tab) {
    if (!["highlights", "bookmarks", "notes"].includes(tab)) return;
    renderHomeLibraryTab(tab);
  },
  getSnapshot(tab = "notes") {
    const activeFolder = activeProfileFolders[tab] || "";
    const folders = tab === "notes" ? [] : getSavedFolders(tab).map((folder) => ({ ...folder }));
    const rows = tab === "notes" ? getSavedNoteRows() : getSavedRows(tab, activeFolder);
    const aiRows = tab === "bookmarks"
      ? Object.values(savedState.aiBookmarks)
        .filter((item) => !activeFolder || (activeFolder === "unfiled" ? !item.folderId : item.folderId === activeFolder))
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
        .map((item) => ({ ...item }))
      : [];
    return {
      tab,
      isConnected: Boolean(supabaseUser),
      activeFolder,
      folders,
      rows: rows.map((row) => ({ ...row, items: row.items?.map((item) => ({ ...item })) })),
      aiRows,
      totalRows: tab === "notes"
        ? rows.length
        : getSavedRows(tab, "").length + (tab === "bookmarks" ? Object.keys(savedState.aiBookmarks).length : 0),
    };
  },
  openSavedVerse,
  openSavedNote,
  setFolder(type, folderId) {
    activeProfileFolders[type] = folderId || "";
    document.dispatchEvent(new CustomEvent("home:library-data-change", { detail: { tab: type } }));
  },
  createFolder(type, name) {
    return createSavedFolder(type, name, { renderProfile: false });
  },
  renameFolder(type, folderId, name) {
    const cleanName = String(name || "").trim().replace(/\s+/g, " ");
    const folders = getSavedFolders(type);
    const folder = folders.find((item) => item.id === folderId);
    if (!folder || !cleanName || folders.some((item) => item.id !== folderId && item.name.toLowerCase() === cleanName.toLowerCase())) {
      return false;
    }
    folder.name = cleanName;
    writeSavedFolders();
    refreshProfilePanel();
    return true;
  },
  deleteFolder(type, folderId) {
    const folders = getSavedFolders(type);
    const index = folders.findIndex((item) => item.id === folderId);
    if (index < 0) return false;
    folders.splice(index, 1);
    const source = getSavedSource(type);
    Object.values(source).forEach((item) => {
      if (item.folderId === folderId) item.folderId = "";
    });
    writeSavedFolders();
    writeSavedSource(type);
    if (type === "bookmarks") {
      Object.values(savedState.aiBookmarks).forEach((item) => {
        if (item.folderId === folderId) item.folderId = "";
      });
      writeJson(aiBookmarksKey, savedState.aiBookmarks);
    }
    if (activeProfileFolders[type] === folderId) activeProfileFolders[type] = "";
    refreshProfilePanel();
    return true;
  },
};
}
