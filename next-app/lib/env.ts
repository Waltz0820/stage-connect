const readEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return "";
};

export const SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL");
export const SUPABASE_ANON_KEY = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");

export const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
