import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowserClient() {
  const url = globalThis?.window?.SUPABASE_URL || "";
  const anonKey = globalThis?.window?.SUPABASE_ANON_KEY || "";

  if (!url || !anonKey) {
    throw new Error("Missing browser Supabase configuration.");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
