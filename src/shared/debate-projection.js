export const debateProjectionVersion = 1;
export const debateProjectionKind = "debate-training-v1";
export const debateProjectionLifetime = 8 * 60 * 60 * 1000;

export function cleanProjectionText(value, limit = 12000) {
  return String(value ?? "").replace(/\[\[\/?FACT\]\]/g, "").replace(/\r\n/g, "\n").trim().slice(0, limit);
}

// Split at word boundaries so every part of a long answer can be projected.
export function projectionPages(value, size = 480) {
  const text = cleanProjectionText(value);
  if (!text) return [];
  const pages = [];
  let rest = text;
  while (rest) {
    let budget = 0;
    let end = 0;
    while (end < rest.length && budget + (rest[end] === "\n" ? 48 : 1) <= size) {
      budget += rest[end] === "\n" ? 48 : 1;
      end += 1;
    }
    if (end === rest.length) break;
    const boundary = Math.max(rest.lastIndexOf(" ", end), rest.lastIndexOf("\n", end));
    const cut = boundary > end / 2 ? boundary : Math.max(1, end);
    pages.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) pages.push(rest);
  return pages;
}

export function conversationSlides(messages = []) {
  return messages.flatMap((message, index) => projectionPages(message.text).map((text, page, pages) => ({
    role: message.role, text, messageIndex: index, page: page + 1, pages: pages.length,
  })));
}

export function publishedMessages(messages = []) {
  return messages.filter(message => message && !message.pending && typeof message.text === "string" && message.text.trim() && ["user", "assistant"].includes(message.role))
    .slice(-20).map(({ role, text }) => ({ role, text: cleanProjectionText(text) }));
}

export function latestResponseSlide(messages) {
  const slides = conversationSlides(messages);
  return Math.max(0, slides.findIndex(slide => slide.messageIndex === messages.length - 1));
}

export function initialProjectionState({ question = "", theme = "", opponent = "", messages = [] } = {}) {
  const published = publishedMessages(messages);
  return {
    version: debateProjectionVersion, question, theme, opponent, messages: published,
    slideIndex: latestResponseSlide(published), referencePage: 0,
    reference: { kind: "verse", title: "", body: "", source: "" },
    workshop: { mode: "reflection", prompt: "Quelle réponse proposeriez-vous ?", takeaway: "", endsAt: null },
    focus: "all", frozen: false, frozenAt: null,
  };
}

// Keep the public payload small and explicitly whitelist every shared field.
export function normalizeProjectionState(input) {
  if (!input || typeof input !== "object" || input.version !== debateProjectionVersion || !Array.isArray(input.messages)) {
    throw Object.assign(new Error("Le contenu de projection est invalide."), { status: 400 });
  }
  const messages = publishedMessages(input.messages);
  const slides = conversationSlides(messages);
  const reference = input.reference || {};
  const workshop = input.workshop || {};
  const integer = (value, max) => Math.max(0, Math.min(max, Math.trunc(Number(value) || 0)));
  const referenceBody = cleanProjectionText(reference.body, 2500);
  return {
    version: debateProjectionVersion,
    question: cleanProjectionText(input.question, 700), theme: cleanProjectionText(input.theme, 120),
    opponent: cleanProjectionText(input.opponent, 80), messages,
    slideIndex: integer(input.slideIndex, Math.max(0, slides.length - 1)),
    reference: {
      kind: ["verse", "fact", "definition"].includes(reference.kind) ? reference.kind : "verse",
      title: cleanProjectionText(reference.title, 140), body: referenceBody, source: cleanProjectionText(reference.source, 300),
    },
    referencePage: integer(input.referencePage, Math.max(0, projectionPages(referenceBody, 300).length - 1)),
    workshop: {
      mode: ["reflection", "takeaway", "reasoning"].includes(workshop.mode) ? workshop.mode : "reflection",
      prompt: cleanProjectionText(workshop.prompt, 240), takeaway: cleanProjectionText(workshop.takeaway, 240),
      endsAt: Number.isFinite(workshop.endsAt) && workshop.endsAt > 0 ? Math.min(workshop.endsAt, Date.now() + 600000) : null,
    },
    focus: ["all", "chat", "reference", "workshop"].includes(input.focus) ? input.focus : "all",
    frozen: Boolean(input.frozen),
    frozenAt: input.frozen && Number.isFinite(input.frozenAt) ? input.frozenAt : null,
  };
}

export function projectionUrl(token) {
  // apiUrl handles the native app's hosted API origin.
  const origin = window.apiUrl?.("/") || window.location.href;
  const url = new URL("debate-projection.html", new URL(origin, window.location.href));
  url.searchParams.set("token", token);
  return url.toString();
}
