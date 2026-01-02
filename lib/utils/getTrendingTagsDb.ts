// src/lib/utils/getTrendingTagsDb.ts
import { supabase } from "../supabase";

export type TrendingTag = {
  tag: string;   // 表示名（#〇〇）
  slug: string;  // ルーティング用（/tags/:slug）
  rank: number;
  count: number;
};

export async function getTrendingTagsDb(limit = 25): Promise<TrendingTag[]> {
  const { data, error } = await supabase.rpc("get_trending_tags", { p_limit: limit });

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    name: string;
    slug: string | null;
    usage_count: number | string | null;
  }>;

  return rows.map((r, i) => ({
    tag: r.name,
    slug: r.slug ?? r.name,
    count: Number(r.usage_count ?? 0),
    rank: i + 1,
  }));
}
