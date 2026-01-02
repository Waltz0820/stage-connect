// src/components/Home.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getTrendingTags } from "../lib/utils/getTrendingTags"; // フォールバック（ローカル）
import { getTrendingTagsDb, type TrendingTag } from "../lib/utils/getTrendingTagsDb";
import SeoHead from "./SeoHead";

// const heroImage = '/images/hero-silhouette.png';

const Home: React.FC = () => {
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  // ✅ DBからトレンドタグを取得（落ちたらローカルにフォールバック）
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setTagsLoading(true);
      try {
        const db = await getTrendingTagsDb(25);
        if (!cancelled) setTrendingTags(db);
      } catch (e) {
        console.warn("Home / getTrendingTagsDb failed -> fallback local:", e);
        const local = getTrendingTags(25).map((t) => ({
          tag: t.tag,
          slug: t.tag, // ローカルは tag名をそのまま slug扱い
          rank: t.rank,
          count: 0,
        }));
        if (!cancelled) setTrendingTags(local);
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // siteUrl（canonical/og:url 用）
  const siteUrl = useMemo(() => {
    const envUrl = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
    if (envUrl) return envUrl.replace(/\/$/, "");
    if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
    return "";
  }, []);

  const canonical = useMemo(() => {
    if (!siteUrl) return "";
    return `${siteUrl}/`;
  }, [siteUrl]);

  const title = "Stage Connect | 2.5次元舞台・ミュージカルのキャスト/作品アーカイブ";
  const description =
    "2.5次元舞台・ミュージカルの作品とキャストをつなぐデジタルアーカイブ。出演者、配信（VOD）、公演情報、シリーズ情報をまとめて探せます。";

  const ogImage = useMemo(() => {
    const envOg = (import.meta as any)?.env?.VITE_OG_IMAGE as string | undefined;
    if (envOg) return envOg;
    return "";
  }, []);

  // ランキングに応じたスタイルを決定するヘルパー
  const getTagStyle = (rank: number) => {
    if (rank <= 3)
      return "text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]";
    if (rank <= 8)
      return "text-xl md:text-2xl font-bold text-neon-purple drop-shadow-[0_0_5px_rgba(180,108,255,0.6)]";
    if (rank <= 15) return "text-lg md:text-xl font-medium text-neon-pink/90";
    return "text-base text-slate-400";
  };

  // ✅ /tags/:slug 用（日本語も壊れないようにURLエンコード）
  const toTagLink = (slugOrName: string) => `/tags/${encodeURIComponent(slugOrName)}`;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 py-20 text-center overflow-hidden">
      {/* ✅ SEO */}
      <SeoHead
        title={title}
        description={description}
        canonical={canonical}
        metas={[
          { property: "og:type", content: "website" },
          { property: "og:site_name", content: "Stage Connect" },
          { property: "og:title", content: title },
          { property: "og:description", content: description },
          ...(canonical ? [{ property: "og:url", content: canonical }] : []),
          ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
          { name: "twitter:card", content: ogImage ? "summary_large_image" : "summary" },
          { name: "twitter:title", content: title },
          { name: "twitter:description", content: description },
          ...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
        ]}
      />

      {/* Stage Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-purple/20 via-theater-black/0 to-transparent blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-4xl space-y-12 animate-fade-in-up">
        <div className="space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-neon-purple text-xs font-bold tracking-[0.2em] backdrop-blur-md shadow-[0_0_15px_rgba(180,108,255,0.15)]">
            DIGITAL ARCHIVE
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            <span className="block drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]">STAGE</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-white to-neon-pink drop-shadow-[0_0_10px_rgba(180,108,255,0.5)]">
              CONNECT
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-lg text-slate-400 leading-relaxed font-light tracking-wide">
            2.5次元舞台とキャストをつなぐ、デジタル・アーカイブ
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-8 flex-wrap">
          <Link
            to="/actors"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white uppercase tracking-widest overflow-hidden rounded-lg bg-theater-surface border border-neon-purple/50 shadow-[0_0_20px_rgba(180,108,255,0.2)] hover:shadow-[0_0_30px_rgba(180,108,255,0.5)] transition-all duration-300 hover:-translate-y-1 min-w-[200px]"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-neon-purple to-neon-pink opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            推しを見つける
          </Link>

          <Link
            to="/plays"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-slate-300 uppercase tracking-widest overflow-hidden rounded-lg bg-transparent border border-white/20 hover:border-white/50 hover:text-white transition-all duration-300 hover:-translate-y-1 min-w-[200px]"
          >
            作品を探す
          </Link>

          <Link
            to="/series"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-slate-300 uppercase tracking-widest overflow-hidden rounded-lg bg-transparent border border-white/20 hover:border-neon-cyan/50 hover:text-white transition-all duration-300 hover:-translate-y-1 min-w-[200px]"
          >
            <span className="absolute inset-0 w-full h-full bg-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            人気シリーズから
          </Link>
        </div>

        {/* Trending Tags Cloud */}
        <div className="pt-16 sm:pt-24 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-slate-500"></span>
            <h3 className="text-xs font-bold text-slate-500 tracking-[0.3em] uppercase">TREND WORDS</h3>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-slate-500"></span>
          </div>

          {/* ✅ ローディング中は薄く */}
          <div className={`transition-opacity ${tagsLoading ? "opacity-40" : "opacity-100"}`}>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 max-w-3xl mx-auto">
              {trendingTags.map((tag, index) => (
                <Link
                  key={`${tag.slug}-${tag.rank}`}
                  to={toTagLink(tag.slug)}
                  className={`transition-all duration-300 hover:scale-110 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/60 rounded ${getTagStyle(
                    tag.rank
                  )}`}
                  style={{
                    animation: `pulse ${3 + index * 0.2}s infinite ease-in-out`,
                  }}
                  aria-label={`タグ「${tag.tag}」のページへ`}
                  title={`#${tag.tag}`}
                >
                  #{tag.tag}
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <Link
                to="/tags"
                className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs font-bold hover:bg-white/10 hover:border-neon-purple/40 transition-colors"
              >
                タグ一覧を見る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
