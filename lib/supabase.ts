// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const viteEnv =
  typeof import.meta !== "undefined" && (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env!
    : {};

const supabaseUrl =
  viteEnv.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";
const supabaseAnonKey =
  viteEnv.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Vite SPAならこれで安定
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
