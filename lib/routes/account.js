import { sendJson, readJsonBody } from "../http/json.js";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../supabase/server.js";


export function handleSupabaseConfig(res) {
  sendJson(res, 200, {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  });
}

export async function handleAccountDeletion(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { allow: "POST" });
    res.end();
    return;
  }

  const authorization = String(req.headers.authorization || "");
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!accessToken) {
    sendJson(res, 401, { error: "A signed-in session is required to delete the account." });
    return;
  }

  const supabase = getSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    sendJson(res, 401, { error: "Your session has expired. Sign in again before deleting the account." });
    return;
  }

  const admin = getSupabaseAdminClient();
  const userDataTables = [
    ["prayer_interactions", "user_id"],
    ["prayer_requests", "author_id"],
    ["user_app_state", "user_id"],
    ["ai_conversations", "user_id"],
    ["user_saved_items", "user_id"],
    ["user_topic_progress", "user_id"],
    ["user_preferences", "user_id"],
    ["intercession_prayer_sessions", "user_id"],
    ["intercession_prayer_reminders", "user_id"],
    ["profiles", "id"],
  ];
  for (const [table, column] of userDataTables) {
    const { error } = await admin.from(table).delete().eq(column, user.id);
    if (error) {
      const cleanupError = new Error(`Could not delete account data from ${table}: ${error.message}`);
      cleanupError.status = 502;
      throw cleanupError;
    }
  }

  const { error: deletionError } = await admin.auth.admin.deleteUser(user.id);
  if (deletionError) {
    const error = new Error(deletionError.message || "The account could not be deleted.");
    error.status = 502;
    throw error;
  }

  sendJson(res, 200, { deleted: true });
}
