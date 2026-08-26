import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4000);
const apiBase = "https://rest.api.bible/v1";
const originalLanguagePath = join(root, "data", "original-language.json");
const hiddenBibleAbbreviations = new Set([
  "ASV",
  "ASVBT",
  "engDRA",
  "engF35",
  "enggnv",
  "engKJVCPB",
  "engLXXup",
  "engojps",
  "engOKE",
  "engRV",
  "engWEBU",
  "engWEBUS",
  "engbrent",
  "FBV",
  "NLTCE",
  "NLTUK",
  "TCENT",
  "TOJB2011",
  "WEBBE",
  "WMB",
  "WMBBE",
]);
let originalLanguageCache = null;

await loadEnv(".env.local");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function loadEnv(fileName) {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) {
    return;
  }

  const text = await readFile(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function getApiKey() {
  return process.env.API_BIBLE_KEY || process.env.BIBLE_API_KEY || "";
}

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || "";
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL || "gpt-5.6-sol";
}

async function readJsonBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 64_000) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
  }

  if (!body.trim()) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Invalid JSON body.");
    error.status = 400;
    throw error;
  }
}

async function apiBible(path, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error("Missing API_BIBLE_KEY in .env.local");
    error.status = 401;
    throw error;
  }

  const url = new URL(`${apiBase}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: { "api-key": apiKey },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || `API.Bible returned ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function extractOpenAiText(payload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  const content = payload.output
    ?.flatMap((item) => item.content || [])
    ?.map((item) => item.text || item.output_text || "")
    ?.filter(Boolean)
    ?.join("\n")
    ?.trim();

  return content || "No response text returned.";
}

async function openAiResponse({ instructions, input, maxOutputTokens = 700 }) {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    const error = new Error("Missing OPENAI_API_KEY in .env.local");
    error.status = 401;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error?.message || `OpenAI returned ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return {
    text: extractOpenAiText(payload),
    model: payload.model || getOpenAiModel(),
  };
}

async function handleAiChat(req, res) {
  const body = await readJsonBody(req);
  const prompt = String(body.prompt || "").trim();
  const mode = String(body.mode || "general");
  const history = Array.isArray(body.history)
    ? body.history
      .filter((item) => item && ["user", "assistant"].includes(item.role) && item.text)
      .slice(-24)
      .map((item) => ({
        role: item.role === "assistant" ? "Brother AI" : "User",
        text: String(item.text).trim().slice(0, 4000),
      }))
    : [];

  if (!prompt) {
    sendJson(res, 400, { error: "prompt is required." });
    return;
  }

  const context = history.length
    ? [
      "Recent conversation context from the last 24 hours:",
      ...history.map((item) => `${item.role}: ${item.text}`),
      "",
      "Current user message:",
      prompt,
    ].join("\n")
    : prompt;

  const instructions = mode === "debate"
    ? [
      "You are Brother AI acting as the user's serious but fair debate opponent in a Christian apologetics debate.",
      "Do not coach the user and do not simply encourage them. Challenge their latest argument directly with the strongest reasonable counter-argument.",
      "Identify assumptions, weaknesses, unanswered questions, and conflicting evidence. Make the user defend their position.",
      "If an argument is genuinely strong or difficult to refute, explicitly acknowledge that before continuing the challenge.",
      "Stay respectful and intellectually honest. Never invent Bible quotations or present made-up evidence as fact.",
    ]
    : mode === "evaluation"
      ? [
        "You are Brother AI evaluating a user's Christian apologetics debate response.",
        "Return only the requested JSON. Judge reasoning quality, not whether the position agrees with you.",
      ]
      : [
        "You are Brother AI, a concise Bible study assistant.",
        "Use the recent conversation context when the user refers to something mentioned earlier.",
        "Do not claim you lack context if the answer can be inferred from the provided recent context.",
        "Give biblically grounded, clear, helpful answers. When interpretation is uncertain, say so plainly.",
      ];
  const result = await openAiResponse({
    instructions: instructions.join(" "),
    input: context,
  });
  sendJson(res, 200, result);
}

async function handleVerseAiChat(req, res) {
  const body = await readJsonBody(req);
  const question = String(body.question || "").trim();
  const reference = String(body.reference || "").trim();
  const version = String(body.version || "").trim();
  const verseText = String(body.text || "").trim();

  if (!question || !reference || !verseText) {
    sendJson(res, 400, { error: "question, reference, and text are required." });
    return;
  }

  const result = await openAiResponse({
    instructions: [
      "You are Brother AI in a verse-locked study chat.",
      "Every answer must stay directly connected to the provided Bible verse.",
      "If the user asks something unrelated, briefly connect it back to the verse instead of drifting.",
      "Be concise, pastoral, and clear. Mention interpretive uncertainty when needed.",
    ].join(" "),
    input: [
      `Reference: ${reference}`,
      `Version: ${version || "Unknown"}`,
      `Verse: ${verseText}`,
      `Question: ${question}`,
    ].join("\n"),
  });
  sendJson(res, 200, result);
}

async function handleApologeticsAiChat(req, res) {
  const body = await readJsonBody(req);
  const mode = String(body.mode || "").trim().toLowerCase();
  const message = String(body.message || "").trim();
  const trackTitle = String(body.trackTitle || "").trim();
  const topicTitle = String(body.topicTitle || "").trim();
  const topicSummary = String(body.topicSummary || "").trim();
  const history = Array.isArray(body.history)
    ? body.history
      .filter((item) => item && ["user", "assistant"].includes(item.role) && item.text)
      .slice(-18)
      .map((item) => ({
        role: item.role === "assistant" ? "Assistant" : "User",
        text: String(item.text).trim().slice(0, 4000),
      }))
    : [];

  if (!["muslim", "coach"].includes(mode) || !message || !trackTitle || !topicTitle) {
    sendJson(res, 400, { error: "mode, message, trackTitle, and topicTitle are required." });
    return;
  }

  const opponentCase = Array.isArray(body.opponentCase) ? body.opponentCase.slice(0, 8) : [];
  const keyResponse = Array.isArray(body.keyResponse) ? body.keyResponse.slice(0, 8) : [];
  const keyVerses = Array.isArray(body.keyVerses) ? body.keyVerses.slice(0, 8) : [];
  const questionsToAsk = Array.isArray(body.questionsToAsk) ? body.questionsToAsk.slice(0, 8) : [];
  const pitfalls = Array.isArray(body.pitfalls) ? body.pitfalls.slice(0, 8) : [];

  const dossier = [
    `Track: ${trackTitle}`,
    `Topic: ${topicTitle}`,
    topicSummary ? `Summary: ${topicSummary}` : "",
    opponentCase.length ? `Common opposing claims:\n- ${opponentCase.join("\n- ")}` : "",
    keyResponse.length ? `Core response principles:\n- ${keyResponse.join("\n- ")}` : "",
    keyVerses.length ? `Key verses: ${keyVerses.join(", ")}` : "",
    questionsToAsk.length ? `Questions to ask back:\n- ${questionsToAsk.join("\n- ")}` : "",
    pitfalls.length ? `Traps to avoid:\n- ${pitfalls.join("\n- ")}` : "",
  ].filter(Boolean).join("\n");

  const context = history.length
    ? [
      "Conversation so far:",
      ...history.map((item) => `${item.role}: ${item.text}`),
      "",
      "Current user message:",
      message,
    ].join("\n")
    : message;

  const instructions = mode === "muslim"
    ? [
      `You are roleplaying a realistic, thoughtful ${trackTitle} challenger in an apologetics training exercise.`,
      "Stay fully in character and respond directly to the user's latest argument.",
      "Do not coach the user, do not break character, and do not concede too quickly.",
      "Raise one substantial objection or rebuttal at a time so the exchange feels like a real discussion.",
      "Be concise, respectful, and plausible. Avoid caricature or extremism unless the topic itself requires it.",
      "You may use the topic dossier to stay relevant, but sound like a real person in conversation.",
    ].join(" ")
    : [
      "You are Brother AI acting as an apologetics coach.",
      "Evaluate the user's latest message in light of the topic dossier and the discussion so far.",
      "Comment on strengths, weaknesses, how to improve, and which references or questions would strengthen the answer.",
      "Be concise, practical, and structured. Prefer short sections or bullets when useful.",
      "Do not roleplay the opponent in this mode. You are coaching the user.",
    ].join(" ");

  const result = await openAiResponse({
    instructions,
    input: [
      "Apologetics topic dossier:",
      dossier,
      "",
      context,
    ].join("\n"),
    maxOutputTokens: 500,
  });

  sendJson(res, 200, result);
}

async function handleVersions(res) {
  if (!getApiKey()) {
    sendJson(res, 200, { data: [], configured: false });
    return;
  }

  const languagePayloads = await Promise.all([
    apiBible("/bibles", { language: "eng" }),
    apiBible("/bibles", { language: "fra" }),
  ]);
  const seenVersions = new Set();
  const data = languagePayloads
    .flatMap((payload) => payload.data || [])
    .filter((bible) => ["eng", "fra"].includes(bible.language?.id))
    .filter((bible) => !hiddenBibleAbbreviations.has(bible.abbreviation || bible.abbreviationLocal || ""))
    .map((bible) => {
      const abbreviation = bible.abbreviation || bible.abbreviationLocal || "BIBLE";
      const name = bible.nameLocal || bible.name || bible.description || "Bible";
      const languageId = bible.language?.id || "";
      return {
        id: bible.id,
        abbreviation,
        name,
        language: languageId,
        languageName: bible.language?.nameLocal || bible.language?.name || "",
        source: "api-bible",
        dedupeKey: `${languageId}:${abbreviation.toLowerCase().replace(/\s+/g, "").trim()}`,
      };
    })
    .filter((bible) => {
      if (seenVersions.has(bible.dedupeKey)) {
        return false;
      }
      seenVersions.add(bible.dedupeKey);
      return true;
    })
    .map(({ dedupeKey, ...bible }) => bible)
    .slice(0, 80);

  sendJson(res, 200, { data, configured: true });
}

function handleSupabaseConfig(res) {
  sendJson(res, 200, {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  });
}

async function handleChapter(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const bibleId = url.searchParams.get("bibleId");
  const bookId = url.searchParams.get("bookId");
  const chapter = url.searchParams.get("chapter");

  if (!bibleId || !bookId || !chapter) {
    sendJson(res, 400, { error: "bibleId, bookId, and chapter are required." });
    return;
  }

  const payload = await apiBible(`/bibles/${encodeURIComponent(bibleId)}/chapters/${bookId}.${chapter}`, {
    "content-type": "html",
    "include-notes": "false",
    "include-titles": "true",
    "include-chapter-numbers": "false",
    "include-verse-numbers": "true",
  });

  sendJson(res, 200, payload);
}

async function loadOriginalLanguageData() {
  if (originalLanguageCache) {
    return originalLanguageCache;
  }

  if (!existsSync(originalLanguagePath)) {
    return null;
  }

  originalLanguageCache = JSON.parse(await readFile(originalLanguagePath, "utf8"));
  return originalLanguageCache;
}

async function handleOriginalLanguage(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const bookId = url.searchParams.get("bookId");
  const chapter = Number(url.searchParams.get("chapter"));
  const verse = Number(url.searchParams.get("verse"));

  if (!bookId || !chapter || !verse) {
    sendJson(res, 400, { error: "bookId, chapter, and verse are required." });
    return;
  }

  const data = await loadOriginalLanguageData();
  if (!data) {
    sendJson(res, 404, {
      error: "Original-language data has not been imported yet. Run npm run import:step.",
    });
    return;
  }

  const key = `${bookId}.${chapter}.${verse}`;
  const verseData = data.verses[key];
  if (!verseData) {
    sendJson(res, 404, {
      error: "Original-language data is not available for this verse.",
      key,
      source: data.source,
    });
    return;
  }

  sendJson(res, 200, {
    key,
    language: verseData.language,
    words: verseData.words,
    source: data.source,
  });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

async function requestHandler(req, res) {
  try {
    if (req.url.startsWith("/api/supabase/config")) {
      handleSupabaseConfig(res);
      return;
    }

    if (req.url.startsWith("/api/bible/versions")) {
      await handleVersions(res);
      return;
    }

    if (req.url.startsWith("/api/bible/chapter")) {
      await handleChapter(req, res);
      return;
    }

    if (req.url.startsWith("/api/original-language")) {
      await handleOriginalLanguage(req, res);
      return;
    }

    if (req.url.startsWith("/api/ai/chat")) {
      await handleAiChat(req, res);
      return;
    }

    if (req.url.startsWith("/api/ai/verse")) {
      await handleVerseAiChat(req, res);
      return;
    }

    if (req.url.startsWith("/api/ai/apologetics")) {
      await handleApologeticsAiChat(req, res);
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "Server error" });
  }
}

export default requestHandler;

if (!process.env.VERCEL) {
  const server = createServer(requestHandler);
  server.listen(port, () => {
    console.log(`Brother Bible AI running at http://localhost:${port}/`);
  });
}
