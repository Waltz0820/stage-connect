import { plays } from "../data/plays";
import type { Play } from "../types";

type PlayLike = {
  id?: string;
  slug: string;
  title: string;
  summary?: string | null;
  period?: string | null;
  venue?: string | null;
  vod?: any;
  tags?: string[] | null;
  franchise?: string | null;
  genre?: string | null;
};

// tags が string[] / {name:string}[] / undefined どれでも吸収
function normalizeTags(p: any): string[] | null {
  const t = p?.tags;
  if (!t) return null;
  if (!Array.isArray(t)) return null;

  if (t.length === 0) return [];
  if (typeof t[0] === "string") return t as string[];

  if (typeof t[0] === "object" && t[0] && "name" in t[0]) {
    return (t as any[]).map((x) => x?.name).filter(Boolean);
  }

  return null;
}

export function getPlaysByActorSlug(actorSlug: string): PlayLike[] {
  return plays
    .filter((play: any) => (play.actorSlugs ?? []).includes(actorSlug))
    .map((p: any) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      summary: p.summary ?? null,
      period: p.period ?? null,
      venue: p.venue ?? null,
      vod: p.vod ?? null,
      tags: normalizeTags(p),
      // franchise が string / {name} どっちでも吸収
      franchise: typeof p.franchise === "string" ? p.franchise : p.franchise?.name ?? null,
      genre: p.genre ?? null,
    }));
}
