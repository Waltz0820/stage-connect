import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";

type TagRow = {
  tag_id: string;
  slug: string | null;
  name: string | null;
  type: "world" | "experience" | "origin" | null;
  description: string | null;
  plays_count: number | null;
};

type TagItem = {
  id: string;
  slug: string;
  name: string;
  type: "world" | "experience" | "origin";
  description: string;
  playsCount: number;
};

type PlayRow = {
  id: string;
  title: string | null;
  slug: string | null;
  period: string | null;
  franchise: { name: string | null } | null;
};

type PlayItem = {
  id: string;
  title: string;
  slugOrId: string;
  date?: string;
  franchiseName?: string;
};

const normalizeTag = (r: TagRow): TagItem | null => {
  const id = (r.tag_id ?? "").trim();
  const slug = (r.slug ?? "").trim();
  const name = (r.name ?? "").trim();
  const type = r.type ?? null;

  if (!id || !slug || !name) return null;
  if (type !== "world" && type !== "experience" && type !== "origin") return null;

  return {
    id,
    slug,
    name,
    type,
    description: (r.description ?? "").trim(),
    playsCount: typeof r.plays_count === "number" ? r.plays_count : 0,
  };
};

const normalizePlay = (r: PlayRow): PlayItem | null => {
  const id = (r.id ?? "").trim();
  const title = (r.title ?? "").trim();
  const slugOrId = ((r.slug ?? "").trim() || id).trim();
  if (!id || !title || !slugOrId) return null;

  return {
    id,
    title,
    slugOrId,
    date: (r.period ?? "").trim() || undefined,
    franchiseName: (r.franchise?.name ?? "").trim() || undefined,
  };
};

const badgeByType = (type: TagItem["type"]) => {
  switch (type) {
    case "world":
      return { badge: "bg-white/5 border-white/10 text-slate-200", dot: "bg-white/40", glow: "bg-white/5" };
    case "experience":
      return { badge: "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan", dot: "bg-neon-cyan", glow: "bg-neon-cyan/10" };
    case "origin":
      return { badge: "bg-neon-purple/10 border-neon-purple/30 text-neon-purple", dot: "bg-neon-purple", glow: "bg-neon-purple/10" };
    default:
      return { badge: "bg-white/5 border-white/10 text-slate-200", dot: "bg-white/40", glow: "bg-white/5" };
  }
};

const TagDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [tag, setTag] = useState<TagItem | null>(null);
  const [plays, setPlays] = useState<PlayItem[]>([]);
  const [loading, setLoading] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: "タグ", to: "/tags" },
      { label: tag?.name ?? "タグ詳細" },
    ],
    [tag?.name]
  );

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setTag(null);
    setPlays([]);

    supabase
      .from("tag_play_counts")
      .select("tag_id, slug, name, type, description, plays_count")
      .eq("slug", slug)
      .maybeSingle()
      .then(async (res) => {
        if (res.error || !res.data) {
          setTag(null);
          return;
        }

        const t = normalizeTag(res.data as any);
        if (!t || t.playsCount < 2) {
          setTag(null);
          return;
        }

        setTag(t);

        const playsRes = await supabase
          .from("play_tags")
          .select(
            `
            play:plays (
              id,
              title,
              slug,
              period,
              franchise:franchises ( name )
            )
          `
          )
          .eq("tag_id", t.id);

        if (playsRes.error) {
          setPlays([]);
          return;
        }

        const rows = ((playsRes.data as any) ?? [])
          .map((x: any) => x?.play)
          .filter(Boolean) as PlayRow[];

        const normalized = rows.map(normalizePlay).filter(Boolean) as PlayItem[];

        normalized.sort((a, b) => {
          const ad = a.date ?? "";
          const bd = b.date ?? "";
          if (ad && bd) return bd.localeCompare(ad);
          return a.title.localeCompare(b.title, "ja");
        });

        setPlays(normalized);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (!slug) {
    return <div className="container mx-auto px-6 pt-8 pb-16 max-w-5xl text-slate-500">slug が不正です</div>;
  }

  const SEO_TITLE = tag ? `${tag.name}の2.5次元作品一覧 | Stage Connect` : `タグが見つかりません | Stage Connect`;

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title={SEO_TITLE} robots="noindex,follow" />
      <Breadcrumbs items={breadcrumbs} />

      {loading && (
        <div className="p-20 text-center text-slate-600 font-mono text-xs tracking-[0.3em] animate-pulse">
          LOADING...
        </div>
      )}

      {!loading && !tag && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="text-white font-bold text-xl mb-3">このタグは表示できません</div>
          <div className="text-slate-500 text-sm mb-8">
            作品が2件未満のタグは品質維持のため非公開です。
          </div>
          <Link
            to="/tags"
            className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            タグ一覧へ戻る →
          </Link>
        </div>
      )}

      {!loading && tag && (() => {
        const style = badgeByType(tag.type);
        return (
          <>
            {/* --- HERO --- */}
            <div className="mb-12 text-center relative">
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 ${style.glow} blur-[100px] pointer-events-none`} />
              <span
                className={`relative inline-block px-4 py-1.5 mb-6 rounded-full border text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-sm ${style.badge}`}
              >
                Tag
              </span>
              <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                {tag.name}
              </h1>
              <p className="relative max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed font-light">
                {tag.description || `「${tag.name}」に該当する2.5次元作品をまとめています。`}
              </p>
              <div className="mt-4 text-slate-500 text-xs font-mono">
                {tag.playsCount.toLocaleString()} 作品
              </div>
            </div>

            {/* --- PLAY LIST --- */}
            <div className="bg-theater-surface/30 border border-white/5 rounded-2xl overflow-hidden mb-10">
              <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <div className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                    Works
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {plays.length.toLocaleString()} PLAYS
                </div>
              </div>

              {plays.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-sm">対象作品がありません</div>
              ) : (
                <div className="p-4 sm:p-5 grid grid-cols-1 gap-3">
                  {plays.map((p) => {
                    const playHref = `/plays/${encodeURIComponent(p.slugOrId)}`;
                    const seriesHref = p.franchiseName
                      ? `/series/${encodeURIComponent(p.franchiseName)}`
                      : null;

                    return (
                      <div
                        key={p.id}
                        className="group rounded-xl border border-white/5 bg-black/30 p-5 hover:border-white/15 hover:bg-white/[0.03] transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              to={playHref}
                              className="block text-white font-bold leading-snug group-hover:text-neon-cyan transition-colors"
                            >
                              {p.title}
                            </Link>

                            {(p.franchiseName || p.date) && (
                              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-0">
                                {p.franchiseName && (
                                  <>
                                    {seriesHref ? (
                                      <Link to={seriesHref} className="hover:text-slate-300 transition-colors">
                                        {p.franchiseName}
                                      </Link>
                                    ) : (
                                      <span>{p.franchiseName}</span>
                                    )}
                                  </>
                                )}
                                {p.franchiseName && p.date && <span className="mx-2 text-slate-700">•</span>}
                                {p.date && <span className="font-mono text-[10px]">{p.date}</span>}
                              </div>
                            )}
                          </div>

                          <Link
                            to={playHref}
                            className="shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:bg-white/10 group-hover:text-white transition-all"
                            aria-label="作品詳細へ"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* --- BOTTOM NAV --- */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/tags"
                className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
              >
                タグ一覧へ
              </Link>
              <Link
                to="/search"
                className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
              >
                検索へ
              </Link>
              <Link
                to="/series"
                className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
              >
                シリーズ一覧へ
              </Link>
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default TagDetailPage;
