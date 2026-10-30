import { sendJson, readJsonBody } from "../http/json.js";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../supabase/server.js";
import { readPrayerJournal } from "../prayer/intercession-journal.js";
import { readPrayerVoteSummary, savePrayerVote } from "../prayer/intercession-votes.js";
import { readIntercessionReminders, readIntercessionStats, saveIntercessionReminders, saveIntercessionSession } from "../prayer/intercession-sessions.js";
import { cancelPrayer } from "../supabase/prayer-cancel.js";


export async function handleIntercessionJournal(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Use GET." });
    return;
  }
  const themeId = new URL(req.url, "http://localhost").searchParams.get("themeId");
  const lines = await readPrayerJournal(getSupabaseServerClient(), themeId);
  res.setHeader("Cache-Control", "no-store");
  sendJson(res, 200, { themeId, lines, serverTime: Date.now() });
}

export async function handleIntercessionVotes(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    sendJson(res, 405, { error: "Use GET or POST." });
    return;
  }
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  let userId = null;
  if (token) {
    const { data: { user }, error } = await getSupabaseServerClient().auth.getUser(token);
    if (!error && user) userId = user.id;
  }
  if (req.method === "POST" && !userId) {
    sendJson(res, 401, { error: "Sign in to vote for the next prayer theme." });
    return;
  }
  const admin = getSupabaseAdminClient();
  let votedSession;
  if (req.method === "POST") {
    const { topicId, nextSessionStart } = await readJsonBody(req);
    votedSession = nextSessionStart;
    await savePrayerVote(admin, userId, topicId, nextSessionStart);
  }
  const summary = await readPrayerVoteSummary(admin, userId);
  res.setHeader("Cache-Control", "no-store");
  if (votedSession && votedSession !== summary.nextSessionStart) {
    sendJson(res, 409, { error: "A new session has started. Please vote again." });
    return;
  }
  sendJson(res, 200, { ...summary, serverTime: Date.now() });
}

export async function getAuthenticatedUser(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data: { user }, error } = await getSupabaseServerClient().auth.getUser(token);
  return error || !user ? null : user;
}

export async function handleIntercessionSessions(req, res) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Sign in to save your prayer stats." });
    return;
  }
  const admin = getSupabaseAdminClient();
  if (req.method === "GET") {
    sendJson(res, 200, await readIntercessionStats(admin, user.id));
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Use GET or POST." });
    return;
  }
  await saveIntercessionSession(admin, user.id, await readJsonBody(req));
  sendJson(res, 201, await readIntercessionStats(admin, user.id));
}

export async function handleIntercessionReminders(req, res) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Sign in to save session reminders." });
    return;
  }
  const admin = getSupabaseAdminClient();
  if (req.method === "GET") {
    sendJson(res, 200, await readIntercessionReminders(admin, user.id));
    return;
  }
  if (req.method !== "PUT") {
    sendJson(res, 405, { error: "Use GET or PUT." });
    return;
  }
  sendJson(res, 200, await saveIntercessionReminders(admin, user.id, await readJsonBody(req)));
}

export async function handlePrayerCancellation(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Use POST." });
    return;
  }
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const { data: { user }, error } = await getSupabaseServerClient().auth.getUser(token);
  if (error || !user) {
    sendJson(res, 401, { error: "Sign in again to update your prayer." });
    return;
  }
  const { requestId } = await readJsonBody(req);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(requestId || "")) {
    sendJson(res, 400, { error: "Invalid prayer request." });
    return;
  }
  const count = await cancelPrayer(getSupabaseAdminClient(), requestId, user.id);
  sendJson(res, 200, { count });
}
