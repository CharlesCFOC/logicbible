import { sendJson, readJsonBody } from "../http/json.js";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../supabase/server.js";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { sessionClientIp, withinRateLimit } from "../http/rate-limit.js";
import { coursePassages, distributeCourseActivities, splitCourseText } from "../../src/shared/session-course.js";

import { sessionCreateAttempts, segmentSessionCourse } from "./session-content.js";
const sessionAdminAttempts = new Map();
const sessionAnswerAttempts = new Map();

function publicSession(row) {
  const activity = row?.projection_activity;
  return row ? { id: row.id, name: row.name, accessCode: row.access_code, scheduledAt: row.scheduled_at, status: row.status, startedAt: row.started_at, projectionSlides: row.projection_slides || [], projectionIndex: row.projection_index || 0, projectionUpdatedAt: row.projection_updated_at || null, projectionMedia: row.projection_media || [], projectionActivity: activity ? { index: activity.index, instance: activity.instance, kind: activity.kind, prompt: activity.prompt, options: activity.options, text: activity.text, mode: activity.mode } : null } : null;
}

async function adminSessionPayload(admin, row) {
  const storedCourseContent = row?.course_content || {};
  const savedPassages = coursePassages(storedCourseContent.sourceText || "", storedCourseContent.passages);
  const coursePageCount = savedPassages.length;
  const courseContent = {
    ...storedCourseContent,
    passages: savedPassages,
    activities: distributeCourseActivities(storedCourseContent.activities, coursePageCount),
  };
  let sourceDocumentUrl = "";
  if (row?.source_document_path) {
    try {
      const { data } = await admin.storage.from("bible-session-courses").createSignedUrl(row.source_document_path, 3600);
      sourceDocumentUrl = data?.signedUrl || "";
    } catch { /* The session remains available if the private source link cannot be signed. */ }
  }
  return { ...publicSession(row), courseContent, sourceDocumentName: row?.source_document_name || "", sourceDocumentUrl };
}

function throwSessionDatabaseError(error) {
  if (error?.code === "PGRST205" || error?.code === "42P01" || error?.code === "42703") {
    const unavailable = new Error("Le schéma des sessions n’est pas à jour dans Supabase. Appliquez les migrations bible_sessions_without_churches, bible_session_projection_controls et bible_session_course_content au projet de l’application.");
    unavailable.status = 503;
    throw unavailable;
  }
  throw error;
}

export async function handleSessionCreate(req, res) {
  if (req.method !== "POST") { sendJson(res, 405, { error: "Méthode non autorisée." }); return; }
  if (!withinRateLimit(sessionCreateAttempts, sessionClientIp(req), 5, 60 * 60 * 1000)) { sendJson(res, 429, { error: "Trop de créations depuis cet appareil. Réessayez plus tard." }); return; }
  const body = await readJsonBody(req, 4_000_000);
  const name = String(body.name || "").trim().replace(/\s+/g, " ");
  const password = String(body.adminPassword || "");
  if (name.length < 2 || name.length > 120) { sendJson(res, 400, { error: "Le nom doit contenir de 2 à 120 caractères." }); return; }
  if (password.length < 2 || password.length > 128) { sendJson(res, 400, { error: "Le mot de passe administrateur doit contenir au moins 2 caractères." }); return; }
  let scheduledAt = null;
  if (body.scheduledAt) {
    const date = new Date(body.scheduledAt);
    if (!Number.isFinite(date.getTime())) { sendJson(res, 400, { error: "Date de programmation invalide." }); return; }
    if (date.getTime() <= Date.now()) { sendJson(res, 400, { error: "Choisissez une date future ou laissez ce champ vide pour une session sans horaire." }); return; }
    scheduledAt = date.toISOString();
  }
  const courseContent = body.courseContent && typeof body.courseContent === "object" ? body.courseContent : {};
  const fileName = String(body.sourceDocumentName || "cours").slice(0, 180);
  const mimeType = String(body.sourceDocumentMimeType || "");
  const fileData = String(body.sourceDocumentData || "");
  const allowedCourseTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
  if (!allowedCourseTypes.has(mimeType) || !fileData.length || fileData.length > 3_500_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(fileData)) {
    sendJson(res, 400, { error: "Le document source a expiré. Réimportez-le avant de publier." }); return;
  }
  const fileExtension = ({ "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[mimeType];
  const sourceDocumentPath = `${randomUUID()}.${fileExtension}`;
  const sourceText = String(courseContent.sourceText || "");
  if (!sourceText.trim()) { sendJson(res, 400, { error: "Ajoutez le texte extrait du cours avant de publier." }); return; }
  if (sourceText.length > 60_000) {
    sendJson(res, 400, { error: "Le texte extrait dépasse la limite autorisée de 60 000 caractères." }); return;
  }
  const validPassages = Array.isArray(courseContent.passages) && courseContent.passages.join("") === sourceText;
  const sourceSlides = validPassages ? courseContent.passages : await segmentSessionCourse(sourceText);
  const allSlides = sourceSlides;
  if (allSlides.length > 40) { sendJson(res, 400, { error: "Le cours est trop long pour une session de 40 passages maximum." }); return; }
  courseContent.activities = distributeCourseActivities((Array.isArray(courseContent.activities) ? courseContent.activities : []).slice(0, 8).map(activity => {
    const options = Array.isArray(activity?.options) ? activity.options.slice(0, 6).map(option => String(option).slice(0, 300)) : [];
    const correctIndex = Number.isInteger(activity?.correctIndex) ? activity.correctIndex : 0;
    return {
      kind: ["multiple_choice", "true_false", "event_order", "matching", "verse_challenge"].includes(activity?.kind) ? activity.kind : "multiple_choice",
      prompt: String(activity?.prompt || "").slice(0, 800), options,
      correctIndex: Math.max(0, Math.min(Math.max(0, options.length - 1), correctIndex)),
      explanation: String(activity?.explanation || "").slice(0, 500),
      sourceQuote: String(activity?.sourceQuote || "").slice(0, 500),
      afterPage: Math.max(0, Math.min(sourceSlides.length - 1, Number.isInteger(Number(activity?.afterPage)) ? Number(activity.afterPage) : 0)),
    };
  }).filter(activity => activity.prompt && activity.options.length >= 2), sourceSlides.length);
  const projectionMedia = Array.isArray(courseContent.imageIdeas) ? courseContent.imageIdeas.slice(0, 12).map(idea => {
    let url = "";
    try { const parsed = new URL(String(idea?.url || "").slice(0, 2000)); if (parsed.protocol === "https:") url = parsed.toString(); } catch { /* Ignore invalid image URLs. */ }
    return { slideIndex: Math.max(0, Number(idea?.afterSection) || 0), url, alt: String(idea?.alt || idea?.query || "Illustration").slice(0, 240) };
  }).filter(idea => idea.url) : [];
  courseContent.passages = sourceSlides;
  courseContent.slides = [];
  courseContent.sourceSlideCount = sourceSlides.length;
  const admin = getSupabaseAdminClient();
  const { error: uploadError } = await admin.storage.from("bible-session-courses")
    .upload(sourceDocumentPath, Buffer.from(fileData, "base64"), { contentType: mimeType, upsert: false, cacheControl: "3600" });
  if (uploadError) throw uploadError;
  let row;
  let error;
  for (let tries = 0; tries < 5; tries++) {
    const accessCode = String(randomBytes(4).readUInt32BE(0) % 100_000_000).padStart(8, "0");
    const salt = randomBytes(16).toString("hex");
    const passwordHash = scryptSync(password, salt, 64).toString("hex");
    const result = await admin.from("bible_sessions").insert({ name, access_code: accessCode, admin_password_salt: salt, admin_password_hash: passwordHash, scheduled_at: scheduledAt, course_content: courseContent, source_document_name: fileName.slice(0, 240) || null, source_document_path: sourceDocumentPath, projection_slides: allSlides, projection_index: 0, projection_media: projectionMedia, projection_activity: null }).select("id, name, access_code, scheduled_at, status, started_at, projection_slides, projection_index, projection_media").single();
    row = result.data; error = result.error;
    if (!error) break;
    if (error.code === "PGRST205" || error.code === "42P01" || error.code === "42703") {
      await admin.storage.from("bible-session-courses").remove([sourceDocumentPath]);
      throwSessionDatabaseError(error);
    }
    if (error.code !== "23505") {
      await admin.storage.from("bible-session-courses").remove([sourceDocumentPath]);
      throw error;
    }
  }
  if (error) { await admin.storage.from("bible-session-courses").remove([sourceDocumentPath]); throw error; }
  res.setHeader("Cache-Control", "no-store");
  sendJson(res, 201, publicSession(row));
}

export async function handleSessionLookup(req, res) {
  if (req.method !== "POST") { sendJson(res, 405, { error: "Méthode non autorisée." }); return; }
  const body = await readJsonBody(req, 2000);
  const code = String(body.accessCode || "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(code)) { sendJson(res, 400, { error: "Entrez le code public à 8 chiffres." }); return; }
  const { data, error } = await getSupabaseAdminClient().from("bible_sessions").select("id, name, access_code, scheduled_at, status, started_at").eq("access_code", code).maybeSingle();
  if (error) throwSessionDatabaseError(error);
  res.setHeader("Cache-Control", "no-store");
  sendJson(res, data ? 200 : 404, data ? publicSession(data) : { error: "Aucune session ne correspond à ce code." });
}

export async function handleActiveSessions(req, res) {
  if (req.method !== "GET") { sendJson(res, 405, { error: "Méthode non autorisée." }); return; }
  const { data, error } = await getSupabaseAdminClient().from("bible_sessions")
    .select("name, access_code, started_at")
    .eq("status", "live")
    .order("started_at", { ascending: false })
    .limit(50);
  if (error) throwSessionDatabaseError(error);
  res.setHeader("Cache-Control", "no-store");
  sendJson(res, 200, { sessions: (data || []).map(row => ({ name: row.name, accessCode: row.access_code, startedAt: row.started_at })) });
}

export async function handleSessionAdmin(req, res, action) {
  if (req.method !== "POST") { sendJson(res, 405, { error: "Méthode non autorisée." }); return; }
  const body = await readJsonBody(req, 120_000);
  const code = String(body.accessCode || "").replace(/\D/g, "");
  const attemptKey = `${sessionClientIp(req)}:${code}`;
  if (!withinRateLimit(sessionAdminAttempts, attemptKey, 8, 15 * 60 * 1000)) { sendJson(res, 429, { error: "Trop d’essais. Réessayez dans 15 minutes." }); return; }
  if (!/^\d{8}$/.test(code) || typeof body.adminPassword !== "string") { sendJson(res, 400, { error: "Code ou mot de passe invalide." }); return; }
  const admin = getSupabaseAdminClient();
  let { data: row, error } = await admin.from("bible_sessions").select("id, name, access_code, admin_password_salt, admin_password_hash, scheduled_at, status, started_at, projection_slides, projection_index, projection_updated_at, projection_media, projection_activity, course_content, source_document_name, source_document_path").eq("access_code", code).maybeSingle();
  if (error?.code === "42703" && action !== "control") {
    ({ data: row, error } = await admin.from("bible_sessions").select("id, name, access_code, admin_password_salt, admin_password_hash, scheduled_at, status, started_at").eq("access_code", code).maybeSingle());
  }
  if (error) throwSessionDatabaseError(error);
  if (!row) { sendJson(res, 404, { error: "Session introuvable." }); return; }
  const supplied = scryptSync(body.adminPassword, row.admin_password_salt, 64);
  const expected = Buffer.from(row.admin_password_hash, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) { sendJson(res, 403, { error: "Mot de passe administrateur incorrect." }); return; }
  sessionAdminAttempts.delete(attemptKey);
  if (action === "activity") {
    if (row.status !== "live") { sendJson(res, 409, { error: "Démarrez la session avant de lancer une activité." }); return; }
    const activityIndex = body.activityIndex === null ? null : Number(body.activityIndex);
    const source = Number.isInteger(activityIndex) && activityIndex !== null ? row.course_content?.activities?.[activityIndex] : null;
    if (activityIndex !== null && (!source || !source.prompt || !Array.isArray(source.options) || source.options.length < 2)) {
      sendJson(res, 400, { error: "Cette activité n’est pas disponible." }); return;
    }
    const activeActivity = source ? { index: activityIndex, instance: randomUUID(), kind: source.kind, prompt: source.prompt, options: source.options, correctIndex: source.correctIndex, explanation: source.explanation, sourceQuote: source.sourceQuote || "" } : null;
    const { data: updated, error: activityError } = await admin.from("bible_sessions").update({ projection_activity: activeActivity }).eq("id", row.id)
      .select("id, name, access_code, scheduled_at, status, started_at, projection_slides, projection_index, projection_updated_at, projection_media, projection_activity, course_content, source_document_name, source_document_path").single();
    if (activityError) throwSessionDatabaseError(activityError);
    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, await adminSessionPayload(admin, updated));
    return;
  }
  if (action === "highlight") {
    if (row.status !== "live") { sendJson(res, 409, { error: "Démarrez la session avant de projeter un passage." }); return; }
    const text = String(body.text || "").trim().slice(0, 1200);
    const mode = body.mode === "word" ? "word" : "passage";
    if (!text) { sendJson(res, 400, { error: "Sélectionnez un mot ou un passage dans le cours." }); return; }
    const { data: updated, error: highlightError } = await admin.from("bible_sessions").update({ projection_activity: { instance: randomUUID(), kind: "highlight", mode, text } }).eq("id", row.id)
      .select("id, name, access_code, scheduled_at, status, started_at, projection_slides, projection_index, projection_updated_at, projection_media, projection_activity, course_content, source_document_name, source_document_path").single();
    if (highlightError) throwSessionDatabaseError(highlightError);
    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, await adminSessionPayload(admin, updated));
    return;
  }
  if (action === "control") {
    if (row.status !== "live") { sendJson(res, 409, { error: "Démarrez la session avant de piloter la projection." }); return; }
    const slides = Array.isArray(body.slides) ? body.slides.map(value => String(value)).filter(value => value.trim()) : null;
    const index = Number(body.index);
    if (!slides || slides.length > 40 || slides.some(slide => slide.length > 2000) || !Number.isInteger(index) || index < 0 || index >= slides.length) {
      sendJson(res, 400, { error: "Ajoutez de 1 à 40 diapositives (2 000 caractères maximum chacune) et choisissez une diapositive valide." }); return;
    }
    const { data: updated, error: updateError } = await admin.from("bible_sessions").update({ projection_slides: slides, projection_index: index, projection_updated_at: new Date().toISOString(), projection_activity: null }).eq("id", row.id).select("id, name, access_code, scheduled_at, status, started_at, projection_slides, projection_index, projection_updated_at, projection_media, projection_activity, course_content, source_document_name, source_document_path").single();
    if (updateError) throwSessionDatabaseError(updateError);
    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, await adminSessionPayload(admin, { ...updated, course_content: updated.course_content || row.course_content, source_document_name: updated.source_document_name || row.source_document_name, source_document_path: updated.source_document_path || row.source_document_path }));
    return;
  }
  if (action === "start" && row.status === "ended") { sendJson(res, 409, { error: "Cette session est déjà terminée." }); return; }
  const changes = action === "start" ? { status: "live", started_at: row.started_at || new Date().toISOString() } : { status: "ended", ended_at: new Date().toISOString() };
  const { data: updated, error: updateError } = await admin.from("bible_sessions").update({ ...changes, ...(action === "end" ? { projection_activity: null } : {}) }).eq("id", row.id).select("id, name, access_code, scheduled_at, status, started_at, projection_slides, projection_index, projection_updated_at, projection_media, projection_activity, course_content, source_document_name, source_document_path").single();
  if (updateError) throwSessionDatabaseError(updateError);
  res.setHeader("Cache-Control", "no-store");
  sendJson(res, 200, await adminSessionPayload(admin, { ...updated, course_content: updated.course_content || row.course_content, source_document_name: updated.source_document_name || row.source_document_name, source_document_path: updated.source_document_path || row.source_document_path }));
}

export async function handleSessionStatus(req, res) {
  if (req.method !== "GET") { sendJson(res, 405, { error: "Méthode non autorisée." }); return; }
  const code = new URL(req.url, "http://localhost").searchParams.get("code") || "";
  if (!/^\d{8}$/.test(code)) { sendJson(res, 400, { error: "Code de session invalide." }); return; }
  const admin = getSupabaseAdminClient();
  let { data, error } = await admin.from("bible_sessions").select("id, name, access_code, scheduled_at, status, started_at, projection_slides, projection_index, projection_updated_at, projection_media, projection_activity").eq("access_code", code).maybeSingle();
  if (error?.code === "42703") ({ data, error } = await admin.from("bible_sessions").select("id, name, access_code, scheduled_at, status, started_at").eq("access_code", code).maybeSingle());
  if (error) throwSessionDatabaseError(error);
  res.setHeader("Cache-Control", "no-store");
  sendJson(res, data ? 200 : 404, data ? publicSession(data) : null);
}

export async function handleSessionAnswer(req, res) {
  if (req.method !== "POST") { sendJson(res, 405, { error: "Méthode non autorisée." }); return; }
  const body = await readJsonBody(req, 2000);
  const code = String(body.accessCode || "").replace(/\D/g, "");
  const answer = Number(body.answer);
  if (!/^\d{8}$/.test(code) || !Number.isInteger(answer) || answer < 0 || answer > 5) { sendJson(res, 400, { error: "Réponse invalide." }); return; }
  const attemptKey = `${sessionClientIp(req)}:${code}`;
  if (!withinRateLimit(sessionAnswerAttempts, attemptKey, 30, 60_000)) { sendJson(res, 429, { error: "Attendez un instant avant de réessayer." }); return; }
  const { data: row, error } = await getSupabaseAdminClient().from("bible_sessions")
    .select("status, projection_activity").eq("access_code", code).maybeSingle();
  if (error) throwSessionDatabaseError(error);
  const activity = row?.projection_activity;
  if (row?.status !== "live" || !activity || activity.kind === "highlight" || !Array.isArray(activity.options)) { sendJson(res, 409, { error: "Aucune activité n’est ouverte." }); return; }
  if (String(body.activityInstance || "") !== activity.instance) { sendJson(res, 409, { error: "Cette activité vient de changer. Actualisez l’écran et répondez à nouveau." }); return; }
  if (answer >= activity.options.length) { sendJson(res, 400, { error: "Cette réponse n’est pas disponible." }); return; }
  res.setHeader("Cache-Control", "no-store");
  sendJson(res, 200, { correct: answer === activity.correctIndex, explanation: String(activity.explanation || ""), sourceQuote: String(activity.sourceQuote || "") });
}
