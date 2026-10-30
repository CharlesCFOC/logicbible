import { handleAiChat, handleVerseAiChat, handleApologeticsAiChat } from "../routes/ai.js";
import { handleChurchProjection, handleChurchStudyAi } from "../routes/church.js";
import { handleLegacyBibleQuiz, handleChapterQuiz } from "../routes/quiz.js";
import { handleSessionCreate, handleSessionLookup, handleActiveSessions, handleSessionAdmin, handleSessionStatus, handleSessionAnswer } from "../routes/sessions.js";
import { handleSessionPrepare, handleSessionGenerateActivity, handleSessionSegment } from "../routes/session-content.js";
import { handleVersions, handleChapter, handleBibleSearch, handleOriginalLanguage } from "../routes/bible.js";
import { handleIntercessionJournal, handleIntercessionVotes, handleIntercessionSessions, handleIntercessionReminders, handlePrayerCancellation } from "../routes/prayer.js";
import { handleSupabaseConfig, handleAccountDeletion } from "../routes/account.js";
import { handleBibleStudy } from "../routes/bible-study.js";
import { getSupabaseServerClient } from "../supabase/server.js";
import { sendJson } from "./json.js";
import { createStaticHandler } from "./static-files.js";
import { root } from "../server/environment.js";
import { aiRequestContext, authenticatedAiRoutes, authenticateAiRequest, guestAiActor } from "../ai/access.js";

const serveStatic = createStaticHandler(root);
const nativeAppOrigins = new Set(["https://localhost", "http://localhost"]);

async function handleRequest(req, res) {
  if (req.url?.startsWith("/api/")) {
    const origin = String(req.headers.origin || "");
    if (nativeAppOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.setHeader("Access-Control-Max-Age", "86400");
      res.setHeader("Vary", "Origin");
    }

    if (req.method === "OPTIONS") {
      if (!nativeAppOrigins.has(origin)) {
        res.writeHead(403);
        res.end();
        return;
      }
      res.writeHead(204);
      res.end();
      return;
    }
  }

  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (authenticatedAiRoutes.has(pathname)) {
      res.setHeader("Cache-Control", "no-store");
      aiRequestContext.getStore().actor = await authenticateAiRequest(req, () => getSupabaseServerClient().auth);
    }
    if (req.url.startsWith("/api/supabase/config")) {
      handleSupabaseConfig(res);
      return;
    }

    if (req.url.split("?")[0] === "/api/sessions/create") {
      await handleSessionCreate(req, res);
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/prepare") {
      await handleSessionPrepare(req, res);
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/segment") {
      await handleSessionSegment(req, res);
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/generate-activity") {
      await handleSessionGenerateActivity(req, res);
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/lookup") {
      await handleSessionLookup(req, res);
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/active") {
      await handleActiveSessions(req, res);
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/start") {
      await handleSessionAdmin(req, res, "start");
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/control") {
      await handleSessionAdmin(req, res, "control");
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/activity") {
      await handleSessionAdmin(req, res, "activity");
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/highlight") {
      await handleSessionAdmin(req, res, "highlight");
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/answer") {
      await handleSessionAnswer(req, res);
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/end") {
      await handleSessionAdmin(req, res, "end");
      return;
    }
    if (req.url.split("?")[0] === "/api/sessions/status") {
      await handleSessionStatus(req, res);
      return;
    }

    if (req.url.split("?")[0] === "/api/prayer/intercession-location") {
      const countryCode = String(req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"] || "").toUpperCase();
      res.setHeader("Cache-Control", "no-store");
      sendJson(res, 200, { countryCode: /^[A-Z]{2}$/.test(countryCode) ? countryCode : null });
      return;
    }

    if (req.url.startsWith("/api/account/delete")) {
      await handleAccountDeletion(req, res);
      return;
    }

    if (req.url.split("?")[0] === "/api/prayer/intercession-journal") {
      await handleIntercessionJournal(req, res);
      return;
    }

    if (req.url.split("?")[0] === "/api/church/projection") {
      await handleChurchProjection(req, res);
      return;
    }

    if (req.url.split("?")[0] === "/api/church/study/import") {
      await handleChurchStudyAi(req, res, "import");
      return;
    }

    if (req.url.split("?")[0] === "/api/church/study/generate") {
      await handleChurchStudyAi(req, res, "generate");
      return;
    }

    if (req.url.split("?")[0] === "/api/church/study/translate") {
      await handleChurchStudyAi(req, res, "translate");
      return;
    }

    if (req.url.split("?")[0] === "/api/prayer/intercession-votes") {
      await handleIntercessionVotes(req, res);
      return;
    }

    if (req.url.split("?")[0] === "/api/prayer/intercession-sessions") {
      await handleIntercessionSessions(req, res);
      return;
    }

    if (req.url.split("?")[0] === "/api/prayer/intercession-reminders") {
      await handleIntercessionReminders(req, res);
      return;
    }

    if (req.url.startsWith("/api/prayer/cancel")) {
      await handlePrayerCancellation(req, res);
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

    if (req.url.split("?")[0] === "/api/bible/study") {
      await handleBibleStudy(req, res);
      return;
    }

    if (pathname === "/api/bible/quiz") {
      await handleLegacyBibleQuiz(req, res);
      return;
    }

    if (req.url.startsWith("/api/bible/search")) {
      await handleBibleSearch(req, res);
      return;
    }

    if (req.url.startsWith("/api/original-language")) {
      await handleOriginalLanguage(req, res);
      return;
    }

    if (pathname === "/api/ai/chat") {
      await handleAiChat(req, res);
      return;
    }

    if (pathname === "/api/ai/verse") {
      await handleVerseAiChat(req, res);
      return;
    }

    if (pathname === "/api/ai/chapter-quiz") {
      await handleChapterQuiz(req, res);
      return;
    }

    if (pathname === "/api/ai/apologetics") {
      await handleApologeticsAiChat(req, res);
      return;
    }

    if (req.url.startsWith("/api/")) {
      sendJson(res, 404, { error: "API route not found." });
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    if (error.retryAfter) res.setHeader("Retry-After", String(error.retryAfter));
    sendJson(res, error.status || 500, { error: error.status ? error.message : "Server error. Please try again later." });
  }
}

export function requestHandler(req, res) {
  return aiRequestContext.run({ actor: guestAiActor(req) }, () => handleRequest(req, res));
}
