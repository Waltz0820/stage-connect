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
  date: string | null; // あれば並びに使う
  franchise_slug: string | null; // あればシリーズ導線に使う
  franchise_name: string | null;
};

type PlayItem = {
  id: string;
  title: string;
  slugOrId: string;
  date?: string;
  franchiseSlug?: string;
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
    date: (r.date ?? "").trim() || undefined,
    franchiseSlug: (r.franchise_slug ?? "").trim() || undefined,
    franchiseName: (r.franchise_name ?? "").trim() || undefined,
  };
};

const badgeByType = (type: TagItem["type"]) => {
  switch (type) {
    case "world":
      return "bg-white/5 border-white/10 text-slate-200";
    case "experience":
      return "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan";
    case "origin":
      return "bg-neon-purple/10 border-neon-purple/30 text-neon-purple";
    default:
      return "bg-white/5 border-white/10 text-slate-200";
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
      { label: tag?.name ?? "タグ詳細", to: slug ? `/tags/${encodeURIComponent(slug)}` : "/tags" },
    ],
    [slug, tag?.name]
  );

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setTag(null);
    setPlays([]);

    // まずタグを引く（2件未満は非公開扱い）
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
          // Perplexityルール：2件未満は非公開
          setTag(null);
          return;
        }

        setTag(t);

        // タグに紐づく作品一覧（必要なら view を作るのがベスト）
        // ここは supabase の関係設定がある前提で nested select を試し、
        // ダメなら view 化して差し替えるのが最短。
        const playsRes = await supabase
          .from("play_tags")
          .select(
            `
            plays:plays (
              id,
              title,
              slug,
              date,
              franchise_slug,
              franchise_name
            )
          `
          )
          .eq("tag_id", t.id);

        if (playsRes.error) {
          console.warn("[tags/:slug] plays fetch error", playsRes.error);
          setPlays([]);
          return;
        }

        const rows = ((playsRes.data as any) ?? [])
          .map((x: any) => x?.plays)
          .filter(Boolean) as PlayRow[];

        const normalized = rows.map(normalizePlay).filter(Boolean) as PlayItem[];

        // date があるなら新しい順に寄せる（なければtitle順）
        normalized.sort((a, b) => {
          const ad = a.date ?? "";
          const bd = b.date ?? "";
          if (ad && bd) return bd.localeCompare(ad);
          return a.title.localeCompare(b.title);
        });

        setPlays(normalized);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (!slug) {
    return (
      <div className="container mx-auto px-6 pt-8 pb-16 max-w-5xl text-slate-500">
        slug が不正です
      </div>
    );
  }

  const SEO_TITLE = tag
    ? `${tag.name}の2.5次元作品一覧 | Stage Connect`
    : `タグが見つかりません | Stage Connect`;

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      {/* タグ詳細も noindex（ただしfollowで内部回遊は活かす） */}
      <SeoHead title={SEO_TITLE} robots="noindex,follow" />
      <Breadcrumbs items={breadcrumbs} />

      {loading && <div className="p-10 text-center text-slate-500">読み込み中...</div>}

      {!loading && !tag && (
        <div className="bg-theater-surface/30 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-white font-bold text-lg">このタグは表示できません</div>
          <div className="text-slate-500 text-sm mt-2">
            ※作品が2件未満のタグは非公開です（品質維持のため）
          </div>
          <div className="mt-6">
            <Link
              to="/tags"
              className="px-5 py-3 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
            >
              タグ一覧へ戻る →
            </Link>
          </div>
        </div>
      )}

      {!loading && tag && (
        <>
          <div className="mb-6 text-center">
            <span className={`inline-block px-3 py-1 mb-4 rounded-full border text-xs font-bold tracking-widest uppercase ${badgeByType(tag.type)}`}>
              TAG
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              {tag.name}
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed">
              {tag.description
                ? tag.description
                : "このタグに該当する2.5次元作品をまとめています。"}
              <br />
              <span className="text-slate-500">（対象：{tag.playsCount.toLocaleString()} 作品）</span>
            </p>

            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              <Link
                to="/tags"
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
              >
                タグ一覧へ
              </Link>
              <Link
                to="/search"
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
              >
                検索へ
              </Link>
            </div>
          </div>

          <div className="bg-theater-surface/30 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">LIST</div>
              <div className="text-[10px] text-slate-500">{plays.length.toLocaleString()} 作品</div>
            </div>

            {plays.length === 0 ? (
              <div className="p-10 text-center text-slate-500">対象作品がありません</div>
            ) : (
              <div className="p-4 sm:p-5 grid grid-cols-1 gap-3">
                {plays.map((p) => {
                  // TODO: ここはあなたの「作品詳細ルート」に合わせて調整
                  // 例: /plays/:slug ならこれでOK。別なら差し替え。
                  const playHref = `/plays/${encodeURIComponent(p.slugOrId)}`;
                  const seriesHref = p.franchiseSlug ? `/series/${encodeURIComponent(p.franchiseSlug)}` : null;

                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-white/10 bg-black/30 p-4 hover:border-white/20 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={playHref} className="block text-white font-semibold leading-snug hover:underline">
                            {p.title}
                          </Link>

                          {(p.franchiseName || p.date) && (
                            <div className="mt-1 text-[11px] text-slate-500">
                              {p.franchiseName && (
                                <>
                                  {seriesHref ? (
                                    <Link to={seriesHref} className="hover:underline">
                                      {p.franchiseName}
                                    </Link>
                                  ) : (
                                    <span>{p.franchiseName}</span>
                                  )}
                                </>
                              )}
                              {p.franchiseName && p.date ? <span className="mx-2">•</span> : null}
                              {p.date ? <span>{p.date}</span> : null}
                            </div>
                          )}
                        </div>

                        <Link
                          to={playHref}
                          className="shrink-0 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[11px] font-bold hover:bg-white/10 transition-colors"
                        >
                          作品詳細 →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TagDetailPage;