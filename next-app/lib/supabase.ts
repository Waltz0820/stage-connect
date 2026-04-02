import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseEnv } from "./env";

export const createSupabaseServerClient = () => {
  if (!hasSupabaseEnv) {
    throw new Error("Supabase environment variables are missing for the Next prototype.");
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch,
    },
  });
};
