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
}> = [
  {
    key: "world",
    title: "世界観・ジャンル",
    desc: "ざっくり雰囲気で探す（学園 / 歴史 / 音楽 など）",
    badge: "bg-white/5 border-white/10 text-slate-200",
  },
  {
    key: "experience",
    title: "体験タイプ",
    desc: "観たときの手触りで探す（歌唱 / ダンス / 殺陣 / ギャグ など）",
    badge: "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan",
  },
  {
    key: "origin",
    title: "原作・市場軸",
    desc: "入り口の文脈で探す（漫画原作 / ゲーム原作 など）",
    badge: "bg-neon-purple/10 border-neon-purple/30 text-neon-purple",
  },
];

const TagsIndexPage: React.FC = () => {
  const [items, setItems] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const breadcrumbs = useMemo(
    () => [{ label: "タグ", to: "/tags" }],
    []
  );

  useEffect(() => {
    setLoading(true);

    // 2件以上のタグのみを一覧に出す（Perplexityルール）
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

  const SEO_TITLE = "タグで探す（2.5次元の世界観・体験タイプ） | Stage Connect";

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      {/* タグ一覧は “noindex,follow” 推奨（薄い一覧大量index回避） */}
      <SeoHead title={SEO_TITLE} robots="noindex,follow" />
      <Breadcrumbs items={breadcrumbs} />

      <div className="mb-6 text-center">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs font-bold tracking-widest uppercase">
          TAGS
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          タグで探す
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          2.5次元作品を「雰囲気」や「体験タイプ」で横断して探すためのタグです。
          <br />
          ※タグページは品質維持のため noindex（検索結果には出にくい）で運用します。
        </p>
      </div>

      <div className="bg-theater-surface/30 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-black/20">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="タグ名で検索（例：学園 / 歌唱 / ゲーム原作）"
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10 transition"
          />
          <div className="mt-2 text-[11px] text-slate-500">
            ※作品が2件以上あるタグのみ表示。
          </div>
        </div>

        {loading && <div className="p-10 text-center text-slate-500">読み込み中...</div>}

        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            表示できるタグがまだありません（または検索条件に一致しません）。
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="p-5 space-y-6">
            {sectionMeta.map((sec) => {
              const list = grouped[sec.key];
              if (!list || list.length === 0) return null;

              return (
                <section key={sec.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{sec.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{sec.desc}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${sec.badge}`}>
                      {list.length} tags
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {list.map((t) => (
                      <Link
                        key={t.id}
                        to={`/tags/${encodeURIComponent(t.slug)}`}
                        className="text-[11px] px-3 py-2 rounded-full bg-black/30 border border-white/10 text-slate-200 hover:bg-white/5 transition-colors"
                        title={`${t.playsCount}作品`}
                      >
                        {t.name}
                        <span className="ml-2 text-[10px] text-slate-500">{t.playsCount}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/search"
          className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
        >
          検索へ →
        </Link>
      </div>
    </div>
  );
};

export default TagsIndexPage;