// Legacy features/ai: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function getRecentAiMemory() {
  const cutoff = Date.now() - aiMemoryTtlMs;
  const memory = readJson(aiMemoryKey, [])
    .filter((item) => item && item.createdAt >= cutoff && ["user", "assistant"].includes(item.role) && item.text)
    .slice(-maxAiMemoryMessages);
  writeJson(aiMemoryKey, memory);
  return memory;
}

function rememberAiMessage(role, text) {
  const cleanText = String(text || "").trim();
  if (!cleanText || !["user", "assistant"].includes(role)) {
    return;
  }

  const memory = getRecentAiMemory();
  memory.push({
    role,
    text: cleanText.slice(0, 4000),
    createdAt: Date.now(),
  });
  writeJson(aiMemoryKey, memory.slice(-maxAiMemoryMessages));
  const conversations = readJson(aiConversationsKey, []);
  let conversation = conversations.find((item) => item.id === currentAiConversationId);
  if (!conversation) {
    conversation = { id: currentAiConversationId, createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    conversations.unshift(conversation);
  }
  conversation.messages.push({ role, text: cleanText.slice(0, 4000), createdAt: Date.now() });
  conversation.messages = conversation.messages.slice(-maxAiMemoryMessages);
  conversation.updatedAt = Date.now();
  writeJson(aiConversationsKey, conversations.filter((item) => Date.now() - item.updatedAt < aiMemoryTtlMs).slice(0, 20));
}

function clearAiMemory() {
  removeLocalValue(aiMemoryKey);
}

function startNewAiConversation() {
  window.aiBridge?.newConversation?.();
}

function askAiAboutVerse() {
  startNewAiConversation();
  closeModal();
  setScreen("ai");
  const versePrompt = `Explain ${selectedVerseData.reference} (${selectedVerseData.version}) with biblical context, original language, cross references, and application. Verse: "${selectedVerseData.text}"`;
  document.dispatchEvent(new CustomEvent("ai:prefill", { detail: { prompt: versePrompt } }));
}

function openVerseAiChat(verseData) {
  verseAiContextData = verseData;
  if (!verseAiPanel || !verseAiReference || !verseAiContext || !verseAiThread) {
    askAiAboutVerse();
    return;
  }

  verseAiReference.textContent = `${verseData.reference} · ${verseData.version}`;
  verseAiContext.textContent = verseData.text;
  verseAiThread.innerHTML = `
    <article class="message ai-message">
      <div class="ai-message-stack">
        <div class="message-body rich-text"><p>This chat is locked to ${escapeHtml(verseData.reference)}. Every answer will stay connected to this verse.</p></div>
      </div>
    </article>
  `;
  showModal(verseAiPanel);
  scrollVerseAiThreadToBottom();
  refreshIcons();
}

function scrollVerseAiThreadToBottom() {
  if (verseAiThread) {
    verseAiThread.scrollTop = verseAiThread.scrollHeight;
  }
}

function handleVerseAiSubmit(event) {
  event.preventDefault();
  if (!verseAiContextData || !verseAiInput || !verseAiThread) {
    return;
  }

  const question = verseAiInput.value.trim();
  if (!question) {
    return;
  }

  verseAiThread.insertAdjacentHTML("beforeend", `
    <article class="message user-message">
      <p>${escapeHtml(question)}</p>
    </article>
    <article class="message ai-message">
      <div class="ai-message-stack">
        <div class="message-body shining-text" data-verse-ai-pending>Brother AI is thinking with ${escapeHtml(verseAiContextData.reference)}...</div>
        <div class="ai-message-actions">
          <button type="button" class="ai-action-button" data-ai-action="copy" aria-label="Copy response" title="Copy">
            <i data-lucide="copy"></i>
          </button>
          <button type="button" class="ai-action-button" data-ai-action="bookmark" aria-label="Bookmark response" title="Bookmark">
            <i data-lucide="bookmark"></i>
          </button>
        </div>
      </div>
    </article>
  `);
  verseAiInput.value = "";
  refreshIcons();
  scrollVerseAiThreadToBottom();
  requestVerseAiResponse(question);
}

function clearThinkingState(element) {
  element?.classList.remove("shining-text");
}

async function requestVerseAiResponse(question) {
  const pending = verseAiThread?.querySelector("[data-verse-ai-pending]");
  try {
    if (containsPersonalContactInfo(question)) {
      throw new Error("For your safety, do not include an email address or phone number in AI messages.");
    }
    const response = await aiFetch(apiUrl("/api/ai/verse"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question,
        reference: verseAiContextData.reference,
        version: verseAiContextData.version,
        text: verseAiContextData.text,
        audience: "teen",
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Verse AI request failed.");
    }
    if (pending) {
      const responseText = payload.text || "No response text returned.";
      const article = pending.closest(".ai-message");
      clearThinkingState(pending);
      pending.classList.add("rich-text");
      pending.innerHTML = renderRichText(`**${verseAiContextData.reference}**\n\n${responseText}`);
      if (article) {
        const fullText = `${verseAiContextData.reference}\n\n${responseText}`;
        const messageId = getAiMessageId(fullText);
        article.dataset.aiMessageId = messageId;
        article.dataset.aiMessageText = fullText;
        const actions = article.querySelector(".ai-message-actions");
        if (actions) {
          actions.outerHTML = renderAiMessageActions(messageId);
        }
      }
      pending.removeAttribute("data-verse-ai-pending");
    }
  } catch (error) {
    if (pending) {
      clearThinkingState(pending);
      pending.textContent = error.message || "Verse AI is not available yet.";
      pending.removeAttribute("data-verse-ai-pending");
    }
  }
  refreshIcons();
  scrollVerseAiThreadToBottom();
}

async function copyAiMessage(button) {
  const article = button.closest("[data-ai-message-id]");
  const text = article?.dataset.aiMessageText?.trim();
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    triggerAiActionAnimation(button, "is-success");
    setFeedback("AI response copied.");
  } catch {
    setFeedback("Copy is not available in this browser.");
  }
}

function toggleAiBookmark(button) {
  const article = button.closest("[data-ai-message-id]");
  const messageId = article?.dataset.aiMessageId;
  const text = article?.dataset.aiMessageText?.trim();
  if (!messageId || !text) {
    return;
  }

  if (savedState.aiBookmarks[messageId]) {
    delete savedState.aiBookmarks[messageId];
    article.querySelector(".ai-bookmark-picker")?.remove();
    button.classList.remove("is-active");
    triggerAiActionAnimation(button, "is-success");
    setFeedback("AI bookmark removed.");
  } else {
    savedState.aiBookmarks[messageId] = {
      id: messageId,
      text,
      folderId: "",
      createdAt: new Date().toISOString(),
    };
    button.classList.add("is-active");
    triggerAiActionAnimation(button, "is-success");
    setFeedback("AI response bookmarked.");
  }

  writeJson(aiBookmarksKey, savedState.aiBookmarks);
  if (savedState.aiBookmarks[messageId]) {
    showAiBookmarkPicker(button);
  }
}

function showAiBookmarkPicker(button, selectedFolderId = null) {
  const article = button.closest("[data-ai-message-id]");
  const messageId = article?.dataset.aiMessageId;
  const bookmark = messageId ? savedState.aiBookmarks[messageId] : null;
  if (!article || !bookmark) return;

  article.querySelector(".ai-bookmark-picker")?.remove();
  const options = [
    '<option value="">No tag</option>',
    ...getSavedFolders("bookmarks").map((folder) => `<option value="${escapeAttr(folder.id)}">${escapeHtml(folder.name)}</option>`),
  ].join("");
  const picker = document.createElement("div");
  picker.className = "ai-bookmark-picker";
  picker.innerHTML = `
      <label>Tag
        <select data-ai-bookmark-folder>${options}</select>
      </label>
      <form data-ai-bookmark-folder-form>
        <input name="folder" placeholder="New tag" aria-label="New bookmark tag" />
        <button type="submit" aria-label="Create tag">+</button>
      </form>
      <button type="button" class="ai-bookmark-done" data-ai-bookmark-folder-done aria-label="Validate tag" title="Save tag">✓</button>
  `;
  article.querySelector(".ai-message-actions")?.append(picker);
  const select = picker.querySelector("[data-ai-bookmark-folder]");
  select.value = selectedFolderId === null ? (bookmark.folderId || "") : selectedFolderId;
  picker.querySelector("[data-ai-bookmark-folder-done]")?.addEventListener("click", () => {
    bookmark.folderId = select.value;
    writeJson(aiBookmarksKey, savedState.aiBookmarks);
    picker.remove();
    setFeedback(`AI bookmark filed in ${getFolderName("bookmarks", select.value)}.`);
  });
  picker.querySelector("[data-ai-bookmark-folder-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = event.currentTarget.elements.folder.value.trim();
    const folderId = createSavedFolder("bookmarks", name, { renderProfile: false });
    if (!folderId) return;
    bookmark.folderId = folderId;
    writeJson(aiBookmarksKey, savedState.aiBookmarks);
    showAiBookmarkPicker(button, folderId);
    setFeedback(`AI bookmark filed in ${getFolderName("bookmarks", folderId)}.`);
  });
}

function triggerAiActionAnimation(button, effectClass) {
  if (!button) {
    return;
  }

  button.classList.remove("is-animating", "is-success");
  void button.offsetWidth;
  button.classList.add("is-animating");
  if (effectClass) {
    button.classList.add(effectClass);
  }

  window.clearTimeout(Number(button.dataset.animationTimer || 0));
  button.dataset.animationTimer = String(window.setTimeout(() => {
    button.classList.remove("is-animating", "is-success");
    delete button.dataset.animationTimer;
  }, 380));
}

function renderAiMessageActions(messageId) {
  const bookmarked = Boolean(savedState.aiBookmarks[messageId]);
  return `
    <div class="ai-message-actions">
      <button type="button" class="ai-action-button" data-ai-action="copy" aria-label="Copy response" title="Copy">
        <i data-lucide="copy"></i>
      </button>
      <button type="button" class="ai-action-button${bookmarked ? " is-active" : ""}" data-ai-action="bookmark" aria-label="Bookmark response" title="Bookmark">
        <i data-lucide="bookmark"></i>
      </button>
    </div>
  `;
}

function getAiMessageId(text) {
  const source = String(text || "").trim();
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return `ai-${Math.abs(hash).toString(36)}`;
}
