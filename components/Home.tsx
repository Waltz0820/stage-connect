// src/components/Home.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getTrendingTags } from "../lib/utils/getTrendingTags";
import SeoHead from "./SeoHead";

// const heroImage = '/images/hero-silhouette.png';

const Home: React.FC = () => {
  const trendingTags = getTrendingTags(25);

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
    // 共通OG画像を用意しているなら env で固定（任意）
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

      {/* Hero Silhouette Image - Commented out for now
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[65vh] z-0 pointer-events-none select-none">
        <img 
          src={heroImage} 
          alt="" 
          className="w-full h-full object-contain object-bottom opacity-30"
        />
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-theater-black via-theater-black/80 to-transparent"></div>
      </div>
      */}

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
          <h3 className="text-xs font-bold text-slate-500 tracking-[0.3em] uppercase mb-8 flex items-center justify-center gap-4">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-slate-500"></span>
            TREND WORDS
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-slate-500"></span>
          </h3>

          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 max-w-3xl mx-auto">
            {trendingTags.map((tag, index) => (
              <span
                key={tag.tag}
                className={`cursor-default transition-all duration-300 hover:scale-110 ${getTagStyle(tag.rank)}`}
                style={{
                  animation: `pulse ${3 + index * 0.2}s infinite ease-in-out`,
                }}
              >
                #{tag.tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
