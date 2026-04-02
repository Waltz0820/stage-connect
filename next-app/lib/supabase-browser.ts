import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseEnv } from "./env";

let browserClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseBrowserClient = () => {
  if (!hasSupabaseEnv) {
    throw new Error("Supabase environment variables are missing for browser usage.");
  }

  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return browserClient;
};
