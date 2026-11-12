// Adapter used by React; installed at the original bootstrap point.
function installAiBridge() {
window.aiBridge = {
  async createDebateProjection(state) {
    let response;
    try {
      response = await aiFetch(apiUrl("/api/debate/projection"), {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create", state }),
      });
    } catch (error) {
      if (error.message === "Sign in to use AI features.") {
        throw Object.assign(new Error("Connectez-vous à votre compte pour créer le lien de projection."), { status: 401 });
      }
      throw new Error("La connexion au service de projection a échoué. Réessayez.");
    }
    const payload = await response.json().catch(() => null);
    if (response.status === 401) throw Object.assign(new Error("Votre connexion a expiré. Reconnectez-vous pour créer le lien."), { status: 401 });
    if (response.status === 404) throw new Error("La projection n’est pas encore disponible sur cette version du site. Ouvrez la version locale à jour.");
    if (!response.ok || !payload?.token || !payload?.controlToken || !Number.isFinite(payload.expiresAt)) {
      throw new Error(payload?.error || "Le lien n’a pas pu être créé. Réessayez dans un instant.");
    }
    return payload;
  },
  async openBibleReference(reference) {
    const match = String(reference).match(/^(.+?)\.?\s+(\d{1,3}):(\d{1,3})/);
    if (!match) return;
    const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const aliases = { ex: "Exodus", kgs: "Kings", chr: "Chronicles", ps: "Psalms", song: "Song of Solomon", songofsongs: "Song of Solomon", mk: "Mark", lk: "Luke", jn: "John", jas: "James" };
    const entered = normalize(match[1]);
    const prefix = entered.match(/^[123]/)?.[0] || "";
    const shortName = entered.slice(prefix.length);
    const name = prefix + normalize(aliases[shortName] || shortName);
    const book = BOOKS.find((item) => normalize(item.name) === name)
      || BOOKS.find((item) => normalize(item.name).startsWith(name));
    const chapter = Number(match[2]);
    if (!book || chapter < 1 || chapter > book.chapters) return;
    await openSavedVerse({ bookId: book.id, chapter, number: Number(match[3]) });
  },
  getSnapshot() {
    const memory = getRecentAiMemory();
    const messages = memory.length ? memory.map((item) => ({ ...item })) : [{ role: "assistant", text: "Ask me about a verse, doctrine, original language, cross references, or biblical context." }];
    const histories = readJson(aiConversationsKey, [])
      .filter((item) => Date.now() - Number(item.updatedAt || item.createdAt || 0) < aiMemoryTtlMs)
      .sort((a, b) => Number(b.updatedAt || b.createdAt) - Number(a.updatedAt || a.createdAt))
      .map((conversation) => {
        const firstUser = conversation.messages?.find((message) => message.role === "user");
        const preview = firstUser?.text || "New conversation";
        return { id: conversation.id, preview: preview.length > 30 ? `${preview.slice(0, 30).trim()}...` : preview };
      });
    return { tab: "chat", messages, histories };
  },
  format(text) {
    return renderRichText(text);
  },
  messageId(text) {
    return getAiMessageId(text);
  },
  bookmarked(text) {
    return Boolean(savedState.aiBookmarks[getAiMessageId(text)]);
  },
  async send(prompt, history = []) {
    if (containsPersonalContactInfo(prompt)) {
      throw new Error("For your safety, do not send an email address or phone number to Brother AI.");
    }
    const response = await aiFetch(apiUrl("/api/ai/chat"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, history, audience: "teen" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "AI request failed.");
    const responseText = payload.text || "No response text returned.";
    rememberAiMessage("user", prompt);
    rememberAiMessage("assistant", responseText);
    document.dispatchEvent(new CustomEvent("ai:state-change"));
    return responseText;
  },
  async sendDebate(prompt, history = [], options = {}) {
    if (containsPersonalContactInfo(prompt)) {
      throw new Error("For your safety, do not send an email address or phone number to Brother AI.");
    }
    const response = await aiFetch(apiUrl("/api/ai/chat"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, history, mode: options.mode === "coach" ? "coach" : "debate", difficulty: options.difficulty || "Beginner", personality: options.personality || "serious", audience: "teen" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "AI request failed.");
    return payload.text || "No response text returned.";
  },
  async sendCoach(prompt, history = []) {
    if (containsPersonalContactInfo(prompt)) {
      throw new Error("For your safety, do not send an email address or phone number to Brother AI.");
    }
    const response = await aiFetch(apiUrl("/api/ai/chat"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, history, mode: "coach", audience: "teen" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "AI request failed.");
    return payload.text || "No response text returned.";
  },
  async evaluateDebate(prompt, options = {}) {
    if (containsPersonalContactInfo(prompt)) {
      throw new Error("For your safety, do not send an email address or phone number to Brother AI.");
    }
    const response = await aiFetch(apiUrl("/api/ai/chat"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, history: [], mode: "evaluation", difficulty: options.difficulty || "Beginner", audience: "teen" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "AI evaluation failed.");
    return payload.text || "{}";
  },
  getDebateXp() {
    return Math.max(0, Number(readJson(debateXpKey, 0)) || 0);
  },
  addDebateXp(amount) {
    const nextXp = this.getDebateXp() + Math.max(0, Number(amount) || 0);
    writeJson(debateXpKey, nextXp);
    document.dispatchEvent(new CustomEvent("debate:xp-change"));
    return nextXp;
  },
  newConversation() {
    currentAiConversationId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    localStorage.setItem("brother.aiConversationId", currentAiConversationId);
    clearAiMemory();
    document.dispatchEvent(new CustomEvent("ai:state-change"));
  },
  loadConversation(id) {
    const conversation = readJson(aiConversationsKey, []).find((item) => item.id === id);
    if (!conversation) return null;
    currentAiConversationId = id;
    localStorage.setItem("brother.aiConversationId", id);
    writeJson(aiMemoryKey, conversation.messages || []);
    return (conversation.messages || []).map((item) => ({ ...item }));
  },
  async copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard access is optional on mobile browsers.
    }
  },
  bookmark(text) {
    const messageId = getAiMessageId(text);
    if (savedState.aiBookmarks[messageId]) delete savedState.aiBookmarks[messageId];
    else savedState.aiBookmarks[messageId] = { id: messageId, text, folderId: "", createdAt: new Date().toISOString() };
    writeJson(aiBookmarksKey, savedState.aiBookmarks);
    document.dispatchEvent(new CustomEvent("ai:state-change"));
    document.dispatchEvent(new CustomEvent("home:library-data-change", { detail: { tab: "bookmarks" } }));
  },
};
}
