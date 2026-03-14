import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  priority: number | null;
};

type TagItem = {
  id: string;
  slug: string;
  name: string;
  type: "world" | "experience" | "origin";
  description: string;
  playsCount: number;
  priority: number;
};

const normalize = (r: TagRow): TagItem | null => {
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
    priority: typeof r.priority === "number" ? r.priority : 0,
  };
};

const sectionMeta: Array<{
  key: TagItem["type"];
  title: string;
  desc: string;
  badge: string;
  dot: string;
}> = [
  {
    key: "world",
    title: "世界観・ジャンル",
    desc: "ざっくり雰囲気で探す（学園 / 歴史 / 音楽 など）",
    badge: "bg-white/5 border-white/10 text-slate-200",
    dot: "bg-white/40",
  },
  {
    key: "experience",
    title: "体験タイプ",
    desc: "観たときの手触りで探す（歌唱 / ダンス / 殺陣 / ギャグ など）",
    badge: "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan",
    dot: "bg-neon-cyan",
  },
  {
    key: "origin",
    title: "原作・市場軸",
    desc: "入り口の文脈で探す（漫画原作 / ゲーム原作 など）",
    badge: "bg-neon-purple/10 border-neon-purple/30 text-neon-purple",
    dot: "bg-neon-purple",
  },
];

const TagsIndexPage: React.FC = () => {
  const [items, setItems] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);

    supabase
      .from("public_tags_min2")
      .select("tag_id, slug, name, type, description, plays_count, priority")
      .order("priority", { ascending: false })
      .order("plays_count", { ascending: false })
      .order("name", { ascending: true })
      .then((res) => {
        if (res.error) {
          console.warn("[tags] fetch error", res.error);
          setItems([]);
          return;
        }
        const raw: TagRow[] = (res.data as any) ?? [];
        setItems(raw.map(normalize).filter(Boolean) as TagItem[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((t) => t.name.toLowerCase().includes(s));
  }, [items, q]);

  const grouped = useMemo(() => {
    const map: Record<TagItem["type"], TagItem[]> = {
      world: [],
      experience: [],
      origin: [],
    };
    filtered.forEach((t) => map[t.type].push(t));
    return map;
  }, [filtered]);

  const totalCount = items.length;

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title="タグで探す（2.5次元の世界観・体験タイプ） | Stage Connect" robots="noindex,follow" />
      <Breadcrumbs items={[{ label: "タグ" }]} />

      {/* --- HERO --- */}
      <div className="mb-12 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon-purple/10 blur-[100px] pointer-events-none" />
        <span className="relative inline-block px-4 py-1.5 mb-6 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-sm">
          Tags
        </span>
        <h1 className="relative text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
          タグで探す
        </h1>
        <p className="relative max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed font-light">
          2.5次元作品を「雰囲気」「体験タイプ」「原作の文脈」で横断して探す。
          <br />
          シリーズや検索では出会えない、新しい切り口での作品発見に。
        </p>
      </div>

      {/* --- SEARCH + LIST --- */}
      <div className="bg-theater-surface/30 border border-white/5 rounded-2xl overflow-hidden mb-10">
        <div className="px-6 py-5 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
            <div className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              Tag Library
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {loading ? "LOADING..." : `${totalCount} TAGS`}
          </div>
        </div>

        <div className="px-6 py-5 border-b border-white/5 bg-black/10">
          <div className="relative group">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="タグ名で検索（例：学園 / 歌唱 / ゲーム原作）"
              className="w-full rounded-xl bg-black/30 border border-white/10 px-5 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-neon-purple/40 focus:ring-2 focus:ring-neon-purple/20 transition duration-300"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-neon-purple transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-600 italic">
            ※作品が2件以上あるタグのみ表示しています。
          </div>
        </div>

        {loading && (
          <div className="p-20 text-center text-slate-600 font-mono text-xs tracking-[0.3em] animate-pulse">
            LOADING...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-16 text-center text-slate-500 text-sm">
            該当するタグが見つかりませんでした。
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="p-6 space-y-8">
            {sectionMeta.map((sec) => {
              const list = grouped[sec.key];
              if (!list || list.length === 0) return null;

              return (
                <section key={sec.key}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-2 h-2 rounded-full ${sec.dot}`} />
                    <div>
                      <div className="text-white font-bold text-sm">{sec.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{sec.desc}</div>
                    </div>
                    <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full border font-bold ${sec.badge}`}>
                      {list.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {list.map((t) => (
                      <Link
                        key={t.id}
                        to={`/tags/${encodeURIComponent(t.slug)}`}
                        className="text-[11px] px-3 py-2 rounded-full bg-black/30 border border-white/10 text-slate-200 hover:bg-white/5 hover:border-white/20 transition-all group"
                        title={`${t.playsCount}作品`}
                      >
                        {t.name}
                        <span className="ml-1.5 text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
                          {t.playsCount}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* --- BOTTOM NAV --- */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/search"
          className="px-6 py-2.5 rounded-full bg-neon-purple/20 border border-neon-purple/40 text-white text-xs font-bold hover:bg-neon-purple/30 transition-all"
        >
          検索へ →
        </Link>
        <Link
          to="/series"
          className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
        >
          シリーズ一覧へ
        </Link>
        <Link
          to="/plays"
          className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
        >
          作品一覧へ
        </Link>
      </div>
    </div>
  );
};

export default TagsIndexPage;