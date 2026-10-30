import { sendJson } from "../http/json.js";
import { getApiKey, apiBible } from "../bible/provider.js";
import { findSearchTopic, literalSearchQuery, searchTopics } from "../bible/search.js";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { root } from "../server/environment.js";

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
const originalLanguagePath = join(root, "data", "original-language.json");

export async function handleVersions(res) {
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

export async function handleChapter(req, res) {
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

export async function handleBibleSearch(req, res) {
  const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const bibleId = params.get("bibleId");
  const query = (params.get("query") || "").trim();
  const mode = params.get("mode") || "topic";
  const offset = Math.max(0, Math.min(1000, Number(params.get("offset")) || 0));
  if (!bibleId || !query || query.length > 120 || !["topic", "word", "expression"].includes(mode)) {
    sendJson(res, 400, { error: "Enter a search of up to 120 characters." });
    return;
  }
  if (mode === "topic") {
    const topic = findSearchTopic(query);
    if (!topic) {
      sendJson(res, 200, { results: [], total: 0, message: "Try a topic such as anxiety, peace, forgiveness, prayer, faith, or family.", topics: searchTopics.map(topic => topic.name) });
      return;
    }
    const results = await Promise.all(topic.verses.map(async (id) => {
      const { data } = await apiBible(`/bibles/${encodeURIComponent(bibleId)}/verses/${id}`, { "content-type": "text", "include-verse-numbers": "false", "include-titles": "false", "include-notes": "false" });
      return { id, reference: data.reference, text: data.content };
    }));
    sendJson(res, 200, { results, total: results.length, topic: topic.name });
    return;
  }
  if (mode === "word" && /\s/.test(query)) {
    sendJson(res, 400, { error: "Enter one word, or choose Expression for a phrase." });
    return;
  }
  const { data } = await apiBible(`/bibles/${encodeURIComponent(bibleId)}/search`, { query: literalSearchQuery(query, mode), limit: 20, offset, sort: "relevance" });
  const supportedBooks = new Set("GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV".split(" "));
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const exact = new RegExp(`\\b${escaped}\\b`, "i");
  const candidates = data.verses || [];
  const results = candidates.filter(verse => supportedBooks.has(verse.id.split(".")[0]) && exact.test(verse.text))
    .map(verse => ({ id: verse.id, reference: verse.reference, text: verse.text }));
  sendJson(res, 200, { results, total: data.total || 0, nextOffset: offset + candidates.length, hasMore: candidates.length > 0 && offset + candidates.length < data.total });
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

export async function handleOriginalLanguage(req, res) {
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
