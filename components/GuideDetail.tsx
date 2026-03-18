import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Breadcrumbs from "./Breadcrumbs";
import SeoHead from "./SeoHead";

type Editorial = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  published_at?: string | null;
  category?: "series-guides" | "features" | null;
};

const CATEGORY_LABELS = {
  "series-guides": "シリーズガイド",
  features: "編集部ピックアップ",
} as const;

const GuideDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [item, setItem] = useState<Editorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isPreview = useMemo(() => new URLSearchParams(location.search).get("preview") === "1", [location.search]);

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

  const canonicalUrl = useMemo(() => {
    if (!item?.slug || !siteUrl) return "";
    return `${siteUrl}/guide/${encodeURIComponent(item.slug)}`;
  }, [item?.slug, siteUrl]);

  const seoTitle = item ? `${item.title}${isPreview ? " [Preview]" : ""} | Stage Connect` : "ガイド | Stage Connect";
  const seoDescription = useMemo(() => {
    if (!item) return "シリーズガイドや作品の見どころをまとめた Stage Connect の編集部ガイドです。";
    return truncate(toPlainText(item.summary || item.content || item.title), 155);
  }, [item]);

  const jsonLd = useMemo(() => {
    if (!item || !siteUrl) return null;
    const published = item.published_at ? new Date(item.published_at).toISOString() : undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: item.title,
      description: seoDescription,
      datePublished: published,
      dateModified: published,
      mainEntityOfPage: canonicalUrl || `${siteUrl}/guide/${encodeURIComponent(item.slug)}`,
      author: { "@type": "Organization", name: "Stage Connect" },
      publisher: { "@type": "Organization", name: "Stage Connect" },
    };
  }, [item, siteUrl, canonicalUrl, seoDescription]);

  useEffect(() => {
    if (!slug) return;

    const run = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        let query = supabase
          .from("editorials")
          .select("id, slug, title, summary, content, published_at, category")
          .eq("slug", slug);

        if (!isPreview) {
          query = query.eq("status", "published");
        }

        const { data, error } = await query.maybeSingle();

        if (error || !data) {
          console.warn("GuideDetail fetch error", error);
          setItem(null);
          setNotFound(true);
          return;
        }

        setItem(data as Editorial);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isPreview, slug]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl animate-fade-in-up px-6 pb-16 pt-8 lg:px-8">
        <SeoHead title="読み込み中... | Stage Connect" robots="noindex,nofollow" />
        <Breadcrumbs items={[{ label: "ガイド", to: "/guide" }, { label: "読み込み中…" }]} />
        <div className="mt-10 text-slate-400">読み込み中...</div>
      </div>
    );
  }

  if (!item || notFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-in-up">
        <SeoHead title="ガイドが見つかりません | Stage Connect" robots="noindex,nofollow" />
        <h2 className="text-2xl font-bold text-white">ガイドが見つかりませんでした</h2>
        <Link
          to="/guide"
          className="mt-8 rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
        >
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl animate-fade-in-up px-6 pb-16 pt-8 lg:px-8">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        robots={isPreview ? "noindex,nofollow" : "index,follow"}
        metas={[
          { property: "og:type", content: "article" },
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

      <Breadcrumbs items={[{ label: "ガイド", to: "/guide" }, { label: item.title }]} />

      <div className="mb-8 mt-6">
        {isPreview && (
          <div className="mb-4 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-bold tracking-widest text-amber-200">
            PREVIEW
          </div>
        )}
        {item.category && (
          <div className="mb-3 inline-flex rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-1 text-[11px] font-bold tracking-widest text-neon-cyan">
            {CATEGORY_LABELS[item.category]}
          </div>
        )}
        <div className="mb-2 text-xs font-mono text-neon-cyan/80">
          {item.published_at ? new Date(item.published_at).toLocaleDateString("ja-JP") : ""}
        </div>
        <h1 className="mb-3 text-3xl font-extrabold text-white sm:text-4xl">{item.title}</h1>
        {item.summary && <p className="text-slate-400">{item.summary}</p>}
      </div>

      <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-theater-surface/50 p-6 leading-relaxed text-slate-200">
        {item.content || "本文は準備中です。"}
      </div>
    </div>
  );
};

export default GuideDetail;
