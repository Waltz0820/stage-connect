import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, hasSupabaseEnv } from './env';
import { createSupabaseServerClient } from './supabase';
import { isOshiPoint } from './oshi-points.mjs';

export function votingConfig() {
  const secret = process.env.OSHI_VOTER_SECRET;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 32 || !key || !SUPABASE_URL) return null;
  return { secret, client: createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }) };
}

export type OshiDiscovery = { play_slug: string; votes: number; participants: number };
export async function getOshiDiscovery(point: string): Promise<{ available: boolean; rows: OshiDiscovery[] }> {
  if (!isOshiPoint(point) || !hasSupabaseEnv) return { available: false, rows: [] };
  const client = createSupabaseServerClient();
  const rows: OshiDiscovery[] = [];
  for (let offset = 0; offset <= 100000; offset += 500) {
    const { data, error } = await client.rpc('discover_oshi_plays', { p_point_id: point, p_offset: offset });
    if (error) return { available: false, rows: [] };
    rows.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return { available: true, rows };
}
