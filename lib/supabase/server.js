import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name] || "";
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

export function getSupabaseServerClient() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export function getSupabaseAdminClient() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
