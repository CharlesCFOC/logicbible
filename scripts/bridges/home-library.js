// Adapter used by React; installed at the original bootstrap point.
function installHomeLibraryBridge() {
window.homeLibraryBridge = {
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
