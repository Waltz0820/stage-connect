import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Breadcrumbs from "./Breadcrumbs";
import SeoHead from "./SeoHead";

type Editorial = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  published_at?: string | null;
  category?: "series-guides" | "features" | null;
};

const CATEGORY_LABELS = {
  "series-guides": "シリーズ整理",
  features: "編集部ピックアップ",
} as const;

const GuideList: React.FC = () => {
  const [items, setItems] = useState<Editorial[]>([]);
  const [loading, setLoading] = useState(true);

  const toPlainText = (value: any) =>
    String(value ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const truncate = (text: string, max: number) => (text.length <= max ? text : text.slice(0, max - 1) + "…");

  const siteUrl = useMemo(() => {
    const envUrl = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
    if (envUrl) return envUrl.replace(/\/$/, "");
    if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
    return "";
  }, []);

  const canonicalUrl = useMemo(() => (siteUrl ? `${siteUrl}/guide` : ""), [siteUrl]);
  const seoTitle = "編集部ガイド | Stage Connect";
  const seoDescription = useMemo(() => {
    const base = "シリーズ整理や作品の見どころをまとめた、Stage Connect の編集部ガイド一覧です。";
    const extra = items.length > 0 ? `公開中 ${items.length} 本。` : "公開準備中です。";
    return truncate(`${base}${extra}`, 155);
  }, [items.length]);

  const jsonLd = useMemo(() => {
    if (!siteUrl) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "編集部ガイド",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/guide/${encodeURIComponent(item.slug)}`,
        name: item.title,
      })),
    };
  }, [items, siteUrl]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("editorials")
          .select("id, slug, title, summary, published_at, category")
          .eq("status", "published")
          .order("published_at", { ascending: false, nullsFirst: false });

        if (error) {
          console.warn("GuideList fetch error", error);
          setItems([]);
          return;
        }

        setItems(((data as any) ?? []) as Editorial[]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  return (
    <div className="container mx-auto max-w-5xl animate-fade-in-up px-6 pb-16 pt-8 lg:px-8">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        robots="index,follow"
        metas={[
          { property: "og:type", content: "website" },
          { property: "og:site_name", content: "Stage Connect" },
          { property: "og:title", content: seoTitle },
          { property: "og:description", content: seoDescription },
          ...(canonicalUrl ? [{ property: "og:url", content: canonicalUrl }] : []),
          { name: "twitter:card", content: "summary" },
          { name: "twitter:title", content: seoTitle },
          { name: "twitter:description", content: seoDescription },
        ]}
        jsonLd={jsonLd}
      />

      <Breadcrumbs items={[{ label: "ガイド", to: "/guide" }]} />

      <div className="mb-10 text-center">
        <span className="mb-4 inline-block rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-neon-cyan">
          GUIDE
        </span>
        <h1 className="mb-3 text-3xl font-extrabold text-white sm:text-4xl">編集部ガイド</h1>
        <p className="text-sm text-slate-400">シリーズ整理や作品の見どころを、読み物としてまとめています。</p>
      </div>

      {loading ? (
        <div className="text-slate-400">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/guide/${item.slug}`}
              className="rounded-xl border border-white/5 bg-theater-surface p-6 transition-colors hover:border-neon-cyan/30"
            >
              {item.category && (
                <div className="mb-2 inline-flex rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-2 py-1 text-[10px] font-bold tracking-widest text-neon-cyan">
                  {CATEGORY_LABELS[item.category]}
                </div>
              )}
              <div className="mb-2 text-xs font-mono text-neon-cyan/80">
                {item.published_at ? new Date(item.published_at).toLocaleDateString("ja-JP") : ""}
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">{item.title}</h3>
              <p className="line-clamp-3 text-sm text-slate-400">{truncate(toPlainText(item.summary), 140)}</p>
              <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">続きを読む →</div>
            </Link>
          ))}

          {items.length === 0 && <p className="italic text-slate-500">公開中のガイドはまだありません。</p>}
        </div>
      )}
    </div>
  );
};

export default GuideList;
