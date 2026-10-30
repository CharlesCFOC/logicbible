// Legacy features/saved-items: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function getSavedSource(type) {
  return type === "highlights" ? savedState.highlights : savedState.bookmarks;
}

function writeSavedSource(type) {
  writeJson(type === "highlights" ? "brother.highlights" : "brother.bookmarks", getSavedSource(type));
}

function getSavedFolders(type) {
  if (type === "ai-bookmarks") {
    type = "bookmarks";
  }
  if (!Array.isArray(savedFolders[type])) {
    savedFolders[type] = [];
  }
  return savedFolders[type];
}

function writeSavedFolders() {
  writeJson("brother.savedFolders", savedFolders);
}

function getFolderName(type, folderId) {
  if (!folderId) {
    return "No folder";
  }
  return getSavedFolders(type).find((folder) => folder.id === folderId)?.name || "No folder";
}

function createSavedFolder(type, name, options = {}) {
  const { renderProfile = true } = options;
  const cleanName = name.trim().replace(/\s+/g, " ");
  if (!cleanName) {
    return "";
  }

  const folders = getSavedFolders(type);
  const existing = folders.find((folder) => folder.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    if (renderProfile) {
      activeProfileFolders[type] = existing.id;
      renderProfileSavedPanel(type);
    }
    return existing.id;
  }

  const folder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
  };
  folders.push(folder);
  writeSavedFolders();
  if (renderProfile) {
    activeProfileFolders[type] = folder.id;
    renderProfileSavedPanel(type);
  }
  return folder.id;
}

function assignSavedFolder(type, storageKey, folderId) {
  if (type === "ai-bookmarks") {
    const bookmark = savedState.aiBookmarks[storageKey];
    if (!bookmark) return;
    bookmark.folderId = folderId || "";
    writeJson(aiBookmarksKey, savedState.aiBookmarks);
    refreshProfilePanel();
    return;
  }
  const source = getSavedSource(type);
  if (!source[storageKey]) {
    return;
  }

  source[storageKey].folderId = folderId || "";
  writeSavedSource(type);
  refreshProfilePanel();
}

function bindFolderSelectInteractions(container) {
  container?.querySelectorAll(".saved-folder-select").forEach((label) => {
    const select = label.querySelector("select");
    if (!select) return;
    label.addEventListener("click", (event) => {
      if (event.target === select) return;
      event.preventDefault();
      if (typeof select.showPicker === "function") {
        select.showPicker();
      } else {
        select.focus();
      }
    });
  });
}

function closeSavedFolderPopover() {
  activeSavedFolderPopover?.remove();
  activeSavedFolderPopover = null;
}

function openSavedFolderPopover(trigger) {
  closeSavedFolderPopover();
  const type = trigger.dataset.savedFolderType;
  const storageKey = trigger.dataset.savedFolderKey;
  if (!type || !storageKey) return;

  const currentFolder = trigger.dataset.savedFolderCurrent || "";
  const folders = getSavedFolders(type);
  const modal = document.createElement("div");
  modal.className = "saved-folder-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  const popover = document.createElement("div");
  popover.className = "saved-folder-popover";
  popover.setAttribute("role", "document");
  popover.innerHTML = `
    <strong>Move to folder</strong>
    <button type="button" data-folder-choice="" class="${currentFolder ? "" : "is-active"}" role="menuitem">No folder</button>
    ${folders.map((folder) => `
      <button type="button" data-folder-choice="${escapeAttr(folder.id)}" class="${currentFolder === folder.id ? "is-active" : ""}" role="menuitem">
        ${escapeHtml(folder.name)}
      </button>
      `).join("")}
  `;
  modal.appendChild(popover);
  document.body.appendChild(modal);
  activeSavedFolderPopover = modal;
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeSavedFolderPopover();
  });

  popover.querySelectorAll("[data-folder-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      assignSavedFolder(type, storageKey, button.dataset.folderChoice || "");
      closeSavedFolderPopover();
      refreshHomeLibraryPanel();
    });
  });
}

function bindSavedFolderTriggers(container) {
  container?.querySelectorAll("[data-saved-folder-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      openSavedFolderPopover(trigger);
    });
  });
}

function getSavedRows(type, folderId = activeProfileFolders[type] || "") {
  const source = type === "highlights" ? savedState.highlights : savedState.bookmarks;
  return Object.entries(source)
    .map(([storageKey, item]) => ({ ...item, storageKey }))
    .filter((item) => item?.bookId && item?.chapter && item?.number)
    .filter((item) => !folderId || (folderId === "unfiled" ? !item.folderId : item.folderId === folderId))
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function getSavedNoteRows() {
  const groups = new Map();
  Object.values(savedState.notes)
    .filter((note) => note?.key && (note.noteHtml || note.note))
    .forEach((note) => {
      const groupId = note.noteGroupId || note.key;
      const group = groups.get(groupId) || {
        id: groupId,
        items: [],
        note: note.note || "",
        title: note.noteTitle || "",
        noteHtml: note.noteHtml || "",
        noteFontSize: note.noteFontSize || 17,
        updatedAt: note.updatedAt || "",
      };
      group.items.push({ ...note });
      if (String(note.updatedAt || "") > String(group.updatedAt || "")) {
        group.updatedAt = note.updatedAt;
      }
      if (!group.title && note.noteTitle) group.title = note.noteTitle;
      groups.set(groupId, group);
    });
  return [...groups.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function refreshProfilePanel() {
  if (activeProfileView) {
    renderProfileSavedPanel(activeProfileView);
  }
}

function closeProfileSavedPanel() {
  activeProfileView = "";
  profileViewButtons.forEach((button) => button.classList.remove("is-active"));
  if (profileSavedPanel) {
    profileSavedPanel.hidden = true;
    window.unmountProfileSavedNoteCards?.(profileSavedPanel.querySelector("[data-profile-saved-notes-root]"));
    profileSavedPanel.innerHTML = "";
  }
}

function setProfileTab(tab) {
  document.querySelectorAll("[data-profile-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.profileTab === tab);
  });
  document.dispatchEvent(new CustomEvent("profile:tab-active", { detail: { tab } }));

  if (profileSettingsPanel) {
    profileSettingsPanel.hidden = false;
    document.querySelectorAll("[data-profile-section]").forEach((section) => {
      section.hidden = section.dataset.profileSection !== tab;
    });
  }

  closeProfileSavedPanel();
}

function renderProfileSavedPanel(type) {
  if (!profileSavedPanel) {
    return;
  }

  window.unmountProfileSavedNoteCards?.(profileSavedPanel.querySelector("[data-profile-saved-notes-root]"));

  activeProfileView = type;
  profileViewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.profileView === type);
  });

  if (type === "notes") {
    const rows = getSavedNoteRows();
    profileSavedPanel.hidden = false;
    profileSavedPanel.innerHTML = `
      <div class="saved-panel-title">
        <h3>Notes</h3>
        <span>${rows.length}</span>
      </div>
      <label class="saved-notes-search">
        <i data-lucide="search"></i>
        <input type="search" data-notes-search placeholder="Search notes..." aria-label="Search notes" />
      </label>
      ${rows.length ? '<div class="profile-saved-note-list" data-profile-saved-notes-root></div>' : '<p class="saved-empty">No notes yet. Create a note from the Bible tab and it will appear here.</p>'}
    `;
    const noteRoot = profileSavedPanel.querySelector("[data-profile-saved-notes-root]");
    window.renderProfileSavedNoteCards?.(noteRoot, rows, openSavedNote);
    profileSavedPanel.querySelector("[data-notes-search]")?.addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      profileSavedPanel.querySelectorAll("[data-note-searchable]").forEach((card) => {
        card.hidden = Boolean(query) && !card.dataset.noteSearchable.includes(query);
      });
    });
    refreshIcons();
    return;
  }

  const folders = getSavedFolders(type);
  const activeFolder = activeProfileFolders[type] || "";
  const rows = getSavedRows(type, activeFolder);
  const aiRows = type === "bookmarks"
    ? Object.values(savedState.aiBookmarks)
      .filter((item) => !activeFolder || (activeFolder === "unfiled" ? !item.folderId : item.folderId === activeFolder))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    : [];
  const totalRows = getSavedRows(type, "").length + (type === "bookmarks" ? Object.keys(savedState.aiBookmarks).length : 0);
  const title = type === "highlights" ? "Highlights" : "Bookmarks";
  const empty = type === "highlights"
    ? "No highlights yet. Highlight a verse from the Bible tab and it will appear here."
    : "No bookmarks yet. Bookmark a verse from the Bible tab and it will appear here.";
  const folderEmpty = activeFolder
    ? `No saved verses in ${getFolderName(type, activeFolder)} yet.`
    : empty;
  const folderOptions = [
    '<option value="">No folder</option>',
    ...folders.map((folder) => `<option value="${escapeAttr(folder.id)}">${escapeHtml(folder.name)}</option>`),
  ].join("");

  profileSavedPanel.hidden = false;
  profileSavedPanel.innerHTML = `
    <div class="saved-panel-title">
      <h3>${title}</h3>
      <span>${totalRows}</span>
    </div>
    <div class="saved-folder-tools">
      <div class="saved-folder-chips" aria-label="${title} folders">
        <button class="${activeFolder === "" ? "is-active" : ""}" data-folder-filter="">All</button>
        <button class="${activeFolder === "unfiled" ? "is-active" : ""}" data-folder-filter="unfiled">No folder</button>
        ${folders.map((folder) => `
          <button class="${activeFolder === folder.id ? "is-active" : ""}" data-folder-filter="${escapeAttr(folder.id)}">${escapeHtml(folder.name)}</button>
        `).join("")}
      </div>
      <form class="saved-folder-form" data-folder-form>
        <input type="text" name="folder" placeholder="New folder" aria-label="New folder name" />
        <button aria-label="Create folder"><i data-lucide="plus"></i></button>
      </form>
    </div>
    ${
      rows.length || aiRows.length
        ? `${rows.map((row, index) => `
            <article class="saved-verse-row">
              <button class="saved-verse-open" data-saved-row="${index}">
                ${type === "highlights" ? `<span class="saved-color-dot" style="--saved-color: ${escapeAttr(row.colorValue || "var(--beige)")}" aria-hidden="true"></span>` : '<i data-lucide="bookmark"></i>'}
                <span>
                  <strong>${escapeHtml(row.reference || `${row.bookId} ${row.chapter}:${row.number}`)}</strong>
                  <small>${escapeHtml(row.version || "")}</small>
                  <p>${escapeHtml(row.text || "")}</p>
                </span>
              </button>
              <button class="saved-folder-trigger" type="button" data-saved-folder-trigger data-saved-folder-type="${escapeAttr(type)}" data-saved-folder-key="${escapeAttr(row.storageKey)}" data-saved-folder-current="${escapeAttr(row.folderId || "")}" aria-label="Choose folder" title="Choose folder">
                <i data-lucide="folder"></i>
              </button>
            </article>
          `).join("")}
          ${aiRows.map((row) => `
            <article class="saved-ai-row">
              <div class="saved-ai-row-heading"><i data-lucide="sparkles"></i><strong>AI response</strong></div>
              <p>${escapeHtml(row.text || "")}</p>
              <button class="saved-folder-trigger" type="button" data-saved-folder-trigger data-saved-folder-type="ai-bookmarks" data-saved-folder-key="${escapeAttr(row.id)}" data-saved-folder-current="${escapeAttr(row.folderId || "")}" aria-label="Choose folder" title="Choose folder">
                <i data-lucide="folder"></i>
              </button>
            </article>
          `).join("")}`
        : `<p class="saved-empty">${folderEmpty}</p>`
    }
  `;

  profileSavedPanel.querySelector("[data-folder-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.folder;
    const folderName = input.value.trim() || window.prompt("Folder name") || "";
    createSavedFolder(type, folderName);
    input.value = "";
  });
  profileSavedPanel.querySelectorAll("[data-folder-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeProfileFolders[type] = button.dataset.folderFilter;
      renderProfileSavedPanel(type);
    });
  });
  profileSavedPanel.querySelectorAll("[data-saved-row]").forEach((button) => {
    button.addEventListener("click", () => openSavedVerse(rows[Number(button.dataset.savedRow)]));
  });
  bindSavedFolderTriggers(profileSavedPanel);
  bindFolderSelectInteractions(profileSavedPanel);
  refreshIcons();
}

async function openSavedVerse(row) {
  if (!row) {
    return;
  }

  const matchingVersion = row.version
    ? readerState.versions.find((version) => version.abbreviation === row.version)
    : null;
  if (matchingVersion) {
    readerState.versionId = matchingVersion.id;
    renderVersionOptions();
  }

  readerState.bookId = row.bookId;
  readerState.chapter = Number(row.chapter);
  readerState.showHighlightsOnly = false;
  renderBookOptions();
  renderChapterOptions();
  setScreen("bible");
  await loadChapter();

  window.setTimeout(() => {
    const selector = row.highlightKey
      ? `[data-highlight-key="${CSS.escape(row.highlightKey)}"]`
      : `[data-verse-number="${CSS.escape(String(row.number))}"]`;
    const line = document.querySelector(selector);
    if (!line) {
      return;
    }
    document.querySelectorAll(".scripture-line.is-selected").forEach((item) => item.classList.remove("is-selected"));
    line.classList.add("is-selected");
    line.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

async function openSavedNote(row) {
  const firstVerse = row?.items?.[0];
  if (!firstVerse) {
    return;
  }
  await openSavedVerse(firstVerse);
  window.setTimeout(() => {
    const line = document.querySelector(`[data-verse-key="${CSS.escape(firstVerse.key)}"]`)
      || document.querySelector(`[data-verse-number="${CSS.escape(String(firstVerse.number))}"]`);
    if (!line) {
      return;
    }
    selectedVerseData = getVerseDataFromElement(line);
    line.classList.add("is-selected");
    openRichNoteEditor();
  }, 180);
}
