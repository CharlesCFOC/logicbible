import { sendJson, readJsonBody } from "../http/json.js";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../supabase/server.js";
import { parseAiJson } from "../http/json.js";
import { openAiResponse } from "../ai/provider.js";

const churchAiLastUse = new Map();

export async function handleChurchProjection(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Use GET." });
    return;
  }
  const token = new URL(req.url, "http://localhost").searchParams.get("token") || "";
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    sendJson(res, 400, { error: "Projection link is invalid." });
    return;
  }
  const { data, error } = await getSupabaseAdminClient()
    .from("church_live_sessions")
    .select("state, status, expires_at")
    .eq("projection_token", token)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  res.setHeader("Cache-Control", "no-store");
  sendJson(res, 200, data ? { state: data.state, status: data.status, expiresAt: data.expires_at } : null);
}

function requireChurchAuth(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    const error = new Error("Connectez-vous pour continuer.");
    error.status = 401;
    throw error;
  }
  return getSupabaseServerClient().auth.getUser(token).then(({ data, error: authError }) => {
    if (authError || !data.user) {
      const error = new Error("Votre session a expiré. Reconnectez-vous.");
      error.status = 401;
      throw error;
    }
    return { user: data.user, token };
  });
}

async function requireChurchStudyAccess(req, studyId, { canManage = false } = {}) {
  if (!/^[0-9a-f-]{36}$/i.test(String(studyId || ""))) {
    const error = new Error("Étude introuvable."); error.status = 400; throw error;
  }
  const { user, token } = await requireChurchAuth(req);
  const admin = getSupabaseAdminClient();
  const { data: study, error: studyError } = await admin.from("church_studies")
    .select("id, church_id, title, theme, duration_minutes, status, content")
    .eq("id", studyId).maybeSingle();
  if (studyError) throw studyError;
  if (!study) { const error = new Error("Étude introuvable."); error.status = 404; throw error; }
  const { data: membership, error: membershipError } = await admin.from("church_memberships")
    .select("role, status").eq("church_id", study.church_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership || (canManage && !["manager", "teacher"].includes(membership.role))) {
    const error = new Error("Vous n’avez pas accès à cette étude."); error.status = 403; throw error;
  }
  return { admin, user, token, study, membership };
}

export async function handleChurchStudyAi(req, res, mode) {
  if (req.method !== "POST") { sendJson(res, 405, { error: "Use POST." }); return; }
  const body = await readJsonBody(req, mode === "import" ? 3_800_000 : 64_000);
  const { admin, user, study } = await requireChurchStudyAccess(req, body.studyId, { canManage: mode !== "translate" });
  const lastAiUse = churchAiLastUse.get(user.id) || 0;
  if (Date.now() - lastAiUse < 8_000) { sendJson(res, 429, { error: "Attendez quelques secondes avant une nouvelle demande IA." }); return; }
  churchAiLastUse.set(user.id, Date.now());
  if (study.status !== "draft") { sendJson(res, 409, { error: "Seul un brouillon peut être modifié." }); return; }
  let prompt, input;
  const schemaHint = '{"title":"…","theme":"…","sections":[{"text":"…","references":["Jn 3:16"],"source":"original|proposition_ia"}],"questions":[{"prompt":"…","options":["…","…"],"correctIndex":0,"explanation":"…"}]}';
  if (mode === "import") {
    const { fileName, mimeType, data } = body;
    const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(mimeType) || typeof data !== "string" || data.length > 3_500_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
      sendJson(res, 400, { error: "Importez un PDF ou une image de 2,5 Mo maximum." }); return;
    }
    prompt = `Transcris fidèlement ce support de cours biblique, puis organise son contenu dans le JSON demandé. Conserve les formulations et commentaires du pasteur comme source originale, n’invente pas de contenu manquant, et marque chaque ajout éventuel de ta part source=proposition_ia. Sépare titres, points, références et progression. Les questions sont des propositions IA clairement identifiables, avec réponses vérifiables. Ne transforme jamais un verset cité et ne fabrique pas de citation. Si un passage est illisible, indique-le dans le texte. Durée visée: ${study.duration_minutes} minutes. Format: ${schemaHint}`;
    input = [{ role: "user", content: [
      { type: "input_text", text: `Fichier: ${String(fileName || "support").slice(0, 180)}. ${prompt}` },
      mimeType === "application/pdf"
        ? { type: "input_file", filename: String(fileName || "support").replace(/[^\w.-]/g, "_").slice(0, 100), file_data: `data:${mimeType};base64,${data}` }
        : { type: "input_image", image_url: `data:${mimeType};base64,${data}`, detail: "high" },
    ] }];
  } else if (mode === "generate") {
    const theme = String(body.theme || study.theme || "").trim().slice(0, 500);
    if (theme.length < 3) { sendJson(res, 400, { error: "Saisissez un thème d’au moins trois caractères." }); return; }
    prompt = `Crée une étude biblique pédagogique et fidèle aux textes, pour ${study.duration_minutes} minutes, sur le thème: ${theme}. Ne cite pas de longs textes bibliques et ne prétends pas reproduire une traduction biblique sous licence. Donne des références vérifiables, indique le contexte, propose 4 à 6 séquences et 2 questions de quiz avec corrections et explications. Toute interprétation ou activité générée doit porter source=proposition_ia. Format: ${schemaHint}`;
    input = prompt;
  } else {
    const language = String(body.language || "").trim().slice(0, 60);
    if (!language) { sendJson(res, 400, { error: "Choisissez une langue." }); return; }
    if (study.status === "draft") { sendJson(res, 403, { error: "La traduction est disponible après publication." }); return; }
    const { data: cached, error: cacheError } = await admin.from("church_study_translations")
      .select("translated_content").eq("study_id", study.id).eq("locale", language).maybeSingle();
    if (cacheError) throw cacheError;
    if (cached) { sendJson(res, 200, { content: cached.translated_content, cached: true, verseNotice: "Les références bibliques sont conservées. Les citations de versets ne sont pas remplacées par une traduction IA." }); return; }
    prompt = `Traduis le contenu d’enseignement en ${language}. Préserve exactement les références bibliques, indices de bonnes réponses et nombres. Ne traduis pas les citations bibliques elles-mêmes et n’invente pas de texte biblique; conserve les références et ajoute un avis que la traduction biblique officielle doit être obtenue dans une édition autorisée. Retourne uniquement un objet JSON de même structure, sans autre texte.`;
    const { data: activityRows, error: activityError } = await admin.from("church_study_activities")
      .select("id, kind, prompt, options, explanation").eq("study_id", study.id).order("position");
    if (activityError) throw activityError;
    input = JSON.stringify({ ...study.content, activities: activityRows || [] });
  }
  const { text: output } = await openAiResponse({ instructions: prompt, input, maxOutputTokens: mode === "import" ? 2600 : 1800, jsonMode: true });
  const content = parseAiJson(output);
  if (mode === "translate") {
    const locale = String(body.language).trim().slice(0, 60);
    const { error } = await admin.from("church_study_translations").upsert({ study_id: study.id, locale, translated_content: content, updated_by: user.id }, { onConflict: "study_id,locale" });
    if (error) throw error;
    sendJson(res, 200, { content, cached: false, verseNotice: "Les références bibliques sont conservées. Utilisez une édition autorisée pour lire le verset dans cette langue." }); return;
  }
  sendJson(res, 200, { content, generated: true });
}
