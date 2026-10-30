// Adapter used by React; installed at the original bootstrap point.
function installChurchBridge() {
window.churchBridge = {
  async sessionRequest(path, payload) {
    const response = await fetch(apiUrl(`/api/sessions/${path}`), {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "La demande de session a échoué.");
    return result;
  },
  async prepareOpenSession(file) {
    if (!file || file.size > 2_500_000) throw new Error("Choisissez un PDF ou une image de 2,5 Mo maximum.");
    if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(file.type)) throw new Error("Formats acceptés : PDF, JPEG, PNG ou WebP.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const response = await fetch(apiUrl("/api/sessions/prepare"), {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, data: btoa(binary) }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "L’analyse du document a échoué.");
    return result;
  },
  async generateOpenSessionActivity(text, signal) {
    const response = await fetch(apiUrl("/api/sessions/generate-activity"), {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }), signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "La génération du jeu a échoué.");
    return result.activity;
  },
  async segmentOpenSession(text) {
    const response = await fetch(apiUrl("/api/sessions/segment"), {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Le découpage du cours a échoué.");
    return result.passages || [];
  },
  async createOpenSession(name, adminPassword, scheduledAt, courseContent, sourceDocumentName, file) {
    if (!file || file.size > 2_500_000) throw new Error("Réimportez le document du cours (2,5 Mo maximum).");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return this.sessionRequest("create", { name, adminPassword, scheduledAt, courseContent, sourceDocumentName, sourceDocumentMimeType: file.type, sourceDocumentData: btoa(binary) });
  },
  async findOpenSession(accessCode) { return this.sessionRequest("lookup", { accessCode }); },
  async getActiveOpenSessions() {
    const response = await fetch(apiUrl("/api/sessions/active"), { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Impossible de charger les sessions actives.");
    return result.sessions || [];
  },
  async startOpenSession(accessCode, adminPassword) { return this.sessionRequest("start", { accessCode, adminPassword }); },
  async controlOpenSession(accessCode, adminPassword, slides, index) { return this.sessionRequest("control", { accessCode, adminPassword, slides, index }); },
  async startOpenSessionActivity(accessCode, adminPassword, activityIndex) { return this.sessionRequest("activity", { accessCode, adminPassword, activityIndex }); },
  async highlightOpenSessionText(accessCode, adminPassword, text, mode = "passage") { return this.sessionRequest("highlight", { accessCode, adminPassword, text, mode }); },
  async answerOpenSessionActivity(accessCode, answer, activityInstance) {
    const response = await fetch(apiUrl("/api/sessions/answer"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accessCode, answer, activityInstance }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Impossible d’envoyer cette réponse.");
    return result;
  },
  async endOpenSession(accessCode, adminPassword) { return this.sessionRequest("end", { accessCode, adminPassword }); },
  async joinGuestSession(projectionToken) {
    if (!window.supabase?.createClient) throw new Error("Connexion au service indisponible.");
    const configResponse = await fetch(apiUrl("/api/supabase/config"));
    const config = await configResponse.json();
    if (!config.configured) throw new Error("Configuration du service indisponible.");
    guestSessionClient ||= window.supabase.createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const key = `church-guest-${projectionToken}`;
    let guestToken = localStorage.getItem(key);
    if (!guestToken) { guestToken = crypto.randomUUID(); localStorage.setItem(key, guestToken); }
    const { data, error } = await guestSessionClient.rpc("join_church_live_guest", { target_projection_token: projectionToken, new_guest_token: guestToken });
    if (error) throw error;
    return { team: Number(data), guestToken };
  },
  async submitGuestAnswer(projectionToken, guestToken, activityId, answer) {
    if (!guestSessionClient) throw new Error("Rejoignez d’abord la session.");
    const { data, error } = await guestSessionClient.rpc("submit_church_guest_answer", { target_projection_token: projectionToken, target_guest_token: guestToken, target_activity: activityId, submitted_answer: answer });
    if (error) throw error;
    return data;
  },
  async aiStudyAction(action, payload) {
    const client = requireChurchUser();
    const { data: { session } } = await client.auth.getSession();
    if (!session?.access_token) throw new Error("Reconnectez-vous pour continuer.");
    const response = await fetch(apiUrl(`/api/church/study/${action}`), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "La demande n’a pas abouti.");
    return result;
  },
  async importStudySupport(studyId, file) {
    if (!file || file.size > 2_500_000) throw new Error("Choisissez un PDF ou une image de 2,5 Mo maximum.");
    if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(file.type)) throw new Error("Formats acceptés : PDF, JPEG, PNG ou WebP.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return this.aiStudyAction("import", { studyId, fileName: file.name, mimeType: file.type, data: btoa(binary) });
  },
  async generateStudy(studyId, theme) { return this.aiStudyAction("generate", { studyId, theme }); },
  async translateStudy(studyId, language) { return this.aiStudyAction("translate", { studyId, language }); },
  async getUser() { return supabaseUser ? { id: supabaseUser.id, isGlobalAdmin: supabaseUser.app_metadata?.role === "global_admin" } : null; },
  async getMemberships() {
    const client = requireChurchUser();
    const { data, error } = await client.from("church_memberships").select("id, church_id, role, status, created_at").eq("user_id", supabaseUser.id).order("created_at", { ascending: false });
    if (error) throw error;
    if (!data?.length) return [];
    const { data: churches, error: churchError } = await client.from("churches").select("id, name, city, country, status").in("id", data.map(row => row.church_id));
    if (churchError) throw churchError;
    const byId = new Map((churches || []).map(row => [row.id, row]));
    return data.map(row => ({ ...row, church: byId.get(row.church_id) }));
  },
  async searchChurches(query) {
    const client = requireChurchUser();
    const { data, error } = await client.from("churches").select("id, name, city, country").eq("status", "approved").ilike("name", `%${query}%`).order("name").limit(20);
    if (error) throw error;
    return data || [];
  },
  async requestChurch(name, city, country) {
    const client = requireChurchUser();
    const { error } = await client.from("churches").insert({ name, city: city || null, country: country || null, created_by: supabaseUser.id, status: "pending" });
    if (error) throw error;
  },
  async requestMembership(churchId) {
    const client = requireChurchUser();
    const { error } = await client.from("church_memberships").insert({ church_id: churchId, user_id: supabaseUser.id, role: "member", status: "pending" });
    if (error) throw error;
  },
  async getChurchAdminData(churchId) {
    const client = requireChurchUser();
    const { data, error } = await client.from("church_memberships").select("id, user_id, role, status, created_at").eq("church_id", churchId).eq("status", "pending").order("created_at");
    if (error) throw error;
    return data || [];
  },
  async reviewMembership(id, status) {
    const client = requireChurchUser();
    const { error } = await client.from("church_memberships").update({ status }).eq("id", id);
    if (error) throw error;
  },
  async getChurchMembers(churchId) {
    const client = requireChurchUser();
    const { data, error } = await client.from("church_memberships").select("id, user_id, role, status").eq("church_id", churchId).eq("status", "active").order("created_at");
    if (error) throw error;
    return data || [];
  },
  async setChurchMemberRole(id, role) {
    const client = requireChurchUser();
    const { error } = await client.from("church_memberships").update({ role }).eq("id", id);
    if (error) throw error;
  },
  async getPendingChurches() {
    const client = requireChurchUser();
    if (supabaseUser.app_metadata?.role !== "global_admin") return [];
    const { data, error } = await client.from("churches").select("id, name, city, country, created_by").eq("status", "pending").order("created_at");
    if (error) throw error;
    return data || [];
  },
  async reviewChurch(id, status) {
    const client = requireChurchUser();
    const { error } = await client.from("churches").update({ status }).eq("id", id);
    if (error) throw error;
  },
  async getStudies(churchId) {
    const client = requireChurchUser();
    const { data, error } = await client.from("church_studies").select("id, title, theme, duration_minutes, status, content, scheduled_at, updated_at, created_by").eq("church_id", churchId).order("updated_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async saveStudy(study) {
    const client = requireChurchUser();
    const payload = { ...study, created_by: supabaseUser.id };
    const { data, error } = await client.from("church_studies").insert(payload).select("id").single();
    if (error) throw error;
    return data.id;
  },
  async updateStudy(id, changes) {
    const client = requireChurchUser();
    const { error } = await client.from("church_studies").update(changes).eq("id", id);
    if (error) throw error;
  },
  async getStudyActivities(studyId) {
    const client = requireChurchUser();
    const { data, error } = await client.from("church_study_activities").select("id, position, kind, prompt, options, explanation, duration_seconds, points, enabled").eq("study_id", studyId).order("position");
    if (error) throw error;
    return data || [];
  },
  async createStudyActivity(activity) {
    const client = requireChurchUser();
    const { data, error } = await client.rpc("create_church_study_activity", {
      target_study: activity.studyId, activity_kind: activity.kind, activity_prompt: activity.prompt,
      activity_options: activity.options, correct_answer: activity.correctAnswer,
      activity_explanation: activity.explanation, activity_duration: activity.duration, activity_points: activity.points,
    });
    if (error) throw error;
    return data;
  },
  async deleteStudyActivity(id) {
    const client = requireChurchUser();
    const { error } = await client.from("church_study_activities").delete().eq("id", id);
    if (error) throw error;
  },
  async setStudyActivityEnabled(id, enabled) {
    const client = requireChurchUser();
    const { error } = await client.from("church_study_activities").update({ enabled }).eq("id", id);
    if (error) throw error;
  },
  async saveStudyNote(studyId, body) {
    const client = requireChurchUser();
    const { error } = await client.from("church_study_notes").upsert({ study_id: studyId, user_id: supabaseUser.id, body }, { onConflict: "study_id,user_id" });
    if (error) throw error;
  },
  async getStudyNote(studyId) {
    const client = requireChurchUser();
    const { data, error } = await client.from("church_study_notes").select("body").eq("study_id", studyId).eq("user_id", supabaseUser.id).maybeSingle();
    if (error) throw error;
    return data?.body || "";
  },
  async getStudyMedia(studyId) {
    const client = requireChurchUser();
    const { data, error } = await client.from("church_study_media").select("id, object_path, original_name, media_type, is_ai_illustration, created_at").eq("study_id", studyId).order("created_at");
    if (error) throw error;
    return Promise.all((data || []).map(async item => {
      const { data: signed, error: signError } = await client.storage.from("church-study-files").createSignedUrl(item.object_path, 3600);
      if (signError) throw signError;
      return { ...item, url: signed.signedUrl };
    }));
  },
  async uploadStudyMedia(churchId, studyId, file) {
    const client = requireChurchUser();
    if (!file || file.size > 100 * 1024 * 1024) throw new Error("La taille maximale est de 100 Mo.");
    const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document";
    const safeName = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-150) || "support";
    const objectPath = `${churchId}/${studyId}/${crypto.randomUUID()}_${safeName}`;
    const { error: uploadError } = await client.storage.from("church-study-files").upload(objectPath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { error } = await client.from("church_study_media").insert({ study_id: studyId, object_path: objectPath, original_name: file.name.slice(0, 240), media_type: type, created_by: supabaseUser.id });
    if (error) { await client.storage.from("church-study-files").remove([objectPath]); throw error; }
  },
  async deleteStudyMedia(media) {
    const client = requireChurchUser();
    const { error } = await client.from("church_study_media").delete().eq("id", media.id);
    if (error) throw error;
    const { error: storageError } = await client.storage.from("church-study-files").remove([media.object_path]);
    if (storageError) throw storageError;
  },
  async getLiveSession(churchId) {
    const client = requireChurchUser();
    const { data, error } = await client.from("church_live_sessions").select("id, church_id, study_id, projection_token, status, state, started_at, expires_at").eq("church_id", churchId).eq("status", "active").gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error) throw error;
    return data;
  },
  async startLiveSession(study, teamMode) {
    const client = requireChurchUser();
    const { error: expireError } = await client.from("church_live_sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("church_id", study.church_id).eq("status", "active").lt("expires_at", new Date().toISOString());
    if (expireError) throw expireError;
    const sections = (study.content?.sections || []).map(section => typeof section === "string" ? section : section.text || "").filter(Boolean);
    const state = { title: study.title, theme: study.theme || "", sections, currentIndex: 0, verse: "", mode: "teaching", teamMode: Boolean(teamMode), scoreboard: [] };
    const { data, error } = await client.from("church_live_sessions").insert({
      church_id: study.church_id, study_id: study.id, created_by: supabaseUser.id,
      projection_token: crypto.randomUUID(), state,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    }).select("id, church_id, study_id, projection_token, status, state, started_at, expires_at").single();
    if (error) throw error;
    return data;
  },
  async updateLiveSession(id, state) {
    const client = requireChurchUser();
    const { error } = await client.from("church_live_sessions").update({ state }).eq("id", id).eq("status", "active");
    if (error) throw error;
  },
  async startLiveActivity(sessionId, activityId) {
    const client = requireChurchUser();
    const { data, error } = await client.rpc("start_church_live_activity", { target_session: sessionId, target_activity: activityId });
    if (error) throw error;
    return data;
  },
  async joinLiveSession(sessionId) {
    const client = requireChurchUser();
    const { data, error } = await client.rpc("join_church_live_session", { target_session: sessionId });
    if (error) throw error;
    return data;
  },
  async submitLiveAnswer(sessionId, activityId, answer) {
    const client = requireChurchUser();
    const { data, error } = await client.rpc("submit_church_live_answer", { target_session: sessionId, target_activity: activityId, submitted_answer: answer });
    if (error) throw error;
    return data;
  },
  async checkReplayAnswer(activityId, answer) {
    const client = requireChurchUser();
    const { data, error } = await client.rpc("check_church_replay_answer", { target_activity: activityId, submitted_answer: answer });
    if (error) throw error;
    return data;
  },
  async endLiveSession(session, study) {
    const client = requireChurchUser();
    const { error } = await client.from("church_live_sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", session.id).eq("status", "active");
    if (error) throw error;
    const { error: archiveError } = await client.from("church_studies").update({ status: "archived" }).eq("id", study.id);
    if (archiveError) throw archiveError;
  },
  async publishStudy(id) {
    const client = requireChurchUser();
    const { error } = await client.from("church_studies").update({ status: "published" }).eq("id", id);
    if (error) throw error;
  },
  subscribeLiveSession(churchId, onChange) {
    if (!supabaseClient) return () => {};
    const channel = supabaseClient.channel(`church-live-${churchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "church_live_sessions", filter: `church_id=eq.${churchId}` }, onChange)
      .subscribe();
    return () => supabaseClient.removeChannel(channel);
  },
  async watchProjection(token, onChange) {
    if (!window.supabase?.createClient) throw new Error("Connexion indisponible.");
    const response = await fetch(apiUrl("/api/supabase/config"));
    const config = await response.json();
    if (!config.configured) throw new Error("Configuration Supabase indisponible.");
    const client = window.supabase.createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const query = async () => {
      const { data, error } = await client.from("church_live_sessions").select("id, state, status, expires_at").eq("projection_token", token).eq("status", "active").maybeSingle();
      if (error) throw error;
      onChange(data);
    };
    await query();
    const channel = client.channel(`church-projection-${token}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "church_live_sessions", filter: `projection_token=eq.${token}` }, () => { void query(); })
      .subscribe();
    const timer = window.setInterval(() => { void query(); }, 15000);
    return async () => { window.clearInterval(timer); await client.removeChannel(channel); await client.auth.signOut(); };
  },
};
}
