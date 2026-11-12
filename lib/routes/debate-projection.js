import { randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { sendJson, readJsonBody } from "../http/json.js";
import { sessionClientIp, withinRateLimit } from "../http/rate-limit.js";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../supabase/server.js";
import { authenticateAiRequest } from "../ai/access.js";
import { debateProjectionKind, debateProjectionLifetime, normalizeProjectionState } from "../../src/shared/debate-projection.js";

const attempts = new Map();
const isToken = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const fail = (message, status) => { throw Object.assign(new Error(message), { status }); };

// Uses the existing private bible_sessions storage. Nothing is exposed through
// the browser Data API; only this route returns the whitelisted public state.
export function createDebateProjectionHandler({
  getAdmin = getSupabaseAdminClient,
  authenticate = req => authenticateAiRequest(req, () => getSupabaseServerClient().auth),
} = {}) {
  return async function handleDebateProjection(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "POST"].includes(req.method)) { sendJson(res, 405, { error: "Utilisez GET ou POST." }); return; }
    const params = new URL(req.url, "http://localhost").searchParams;
    if (req.method === "GET") {
      const token = params.get("token") || "";
      if (!isToken(token)) fail("Ce lien de projection est invalide.", 400);
      const { data: row, error } = await getAdmin().from("bible_sessions")
        .select("status, course_content").eq("id", token).maybeSingle();
      if (error) throw error;
      const content = row?.course_content;
      if (content?.kind !== debateProjectionKind) fail("Projection introuvable.", 404);
      if (row.status === "ended" || Date.now() >= content.expiresAt) { sendJson(res, 200, { status: "ended" }); return; }
      sendJson(res, 200, { status: "live", state: normalizeProjectionState(content.state), expiresAt: content.expiresAt });
      return;
    }
    const body = await readJsonBody(req, 260000);
    if (!body || typeof body !== "object" || Array.isArray(body)) fail("Commande invalide.", 400);
    if (body.action === "create") {
      await authenticate(req);
      if (!withinRateLimit(attempts, `create:${sessionClientIp(req)}`, 10, 3600000)) fail("Trop de créations. Réessayez plus tard.", 429);
      const state = normalizeProjectionState(body.state);
      const admin = getAdmin();
      const token = randomUUID();
      const controlToken = randomBytes(32).toString("hex");
      const salt = randomBytes(16).toString("hex");
      const passwordHash = scryptSync(controlToken, salt, 64).toString("hex");
      const expiresAt = Date.now() + debateProjectionLifetime;
      // Keep these out of the ordinary Bible Study live-session directory.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { error } = await admin.from("bible_sessions").insert({
          id: token, name: `Formation débat · ${state.theme || "Église"}`.slice(0, 120),
          access_code: String(randomInt(100000000)).padStart(8, "0"),
          admin_password_salt: salt, admin_password_hash: passwordHash, status: "scheduled",
          course_content: { kind: debateProjectionKind, state, expiresAt },
        });
        if (error?.code === "23505") continue;
        if (error) throw error;
        sendJson(res, 201, { token, controlToken, expiresAt });
        return;
      }
      fail("La session n’a pas pu être créée. Réessayez.", 503);
    }
    if (!["update", "end"].includes(body.action)) fail("Commande inconnue.", 400);
    const token = String(body.token || "");
    const controlToken = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!isToken(token) || !/^[0-9a-f]{64}$/.test(controlToken)) fail("Commande non autorisée.", 401);
    if (!withinRateLimit(attempts, `control:${sessionClientIp(req)}`, 180, 60000)) fail("Attendez un instant avant la prochaine commande.", 429);
    const admin = getAdmin();
    const { data: row, error } = await admin.from("bible_sessions")
      .select("status, admin_password_salt, admin_password_hash, course_content").eq("id", token).maybeSingle();
    if (error) throw error;
    if (row?.course_content?.kind !== debateProjectionKind) fail("Commande non autorisée.", 401);
    const hash = scryptSync(controlToken, row.admin_password_salt, 64);
    const expected = Buffer.from(row.admin_password_hash, "hex");
    if (hash.length !== expected.length || !timingSafeEqual(hash, expected)) fail("Commande non autorisée.", 401);
    if (row.status === "ended" || Date.now() >= row.course_content.expiresAt) fail("Cette projection est terminée. Créez un nouveau lien.", 410);
    const changes = body.action === "end"
      ? { status: "ended", ended_at: new Date().toISOString() }
      : { course_content: { ...row.course_content, state: normalizeProjectionState(body.state) } };
    const { error: updateError } = await admin.from("bible_sessions").update(changes).eq("id", token);
    if (updateError) throw updateError;
    sendJson(res, 200, { ok: true });
  };
}

export const handleDebateProjection = createDebateProjectionHandler();
