// src/components/watch/WatchIndex.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";
import { useOgImage, useSiteUrl } from "../../lib/hooks/useSiteUrl";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

function formatCount(n: number | null | undefined) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString();
}

async function safeCount(tableOrView: string): Promise<number | null> {
  try {
    const res = await supabase.from(tableOrView).select("*", { count: "exact", head: true });
    if (res.error) return null;
    return typeof res.count === "number" ? res.count : null;
  } catch {
    return null;
  }
}

const WatchIndex: React.FC = () => {
  const [dmmSeriesCount, setDmmSeriesCount] = useState<number | null>(null);
  const siteUrl = useSiteUrl();
  const ogImage = useOgImage();

  useEffect(() => {
    safeCount("watch_dmm_franchises").then(setDmmSeriesCount);
  }, []);

  const SEO_TITLE = "配信で観る｜2.5次元舞台の配信サービスガイド";
  const SEO_DESC =
    "2.5次元舞台・ミュージカルを配信で観るためのガイド。DMMプレミアム・U-NEXT・dアニメストアの比較や、作品の探し方を解説します。";

  const canonical = useMemo(() => (siteUrl ? `${siteUrl}/watch` : ""), [siteUrl]);

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "2.5次元舞台はどの配信サービスで観れますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "2.5次元舞台の見放題ラインナップが最も充実しているのはDMMプレミアムです。U-NEXTやdアニメストアでも一部配信されていますが、舞台作品の本数ではDMMが圧倒的です。",
        },
      },
      {
        "@type": "Question",
        name: "Stage Connectで動画を再生できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Stage Connectは作品データベースであり、動画の再生機能はありません。作品詳細ページの視聴リンクから各配信サービスへ遷移してご視聴ください。",
        },
      },
      {
        "@type": "Question",
        name: "配信されている作品が見つからない場合は？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "検索機能を使うか、シリーズ一覧から年表で辿ることで見つかる場合があります。配信状況は変動するため、最新の情報は各配信サービスの公式ページでご確認ください。",
        },
      },
    ],
  };

  return (
    <div className="container mx-auto px-6 pt-8 pb-32 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead
        title={`${SEO_TITLE} | Stage Connect`}
        description={SEO_DESC}
        canonical={canonical}
        robots="index,follow"
        metas={[
          { property: "og:locale", content: "ja_JP" },
          { property: "og:type", content: "article" },
          { property: "og:site_name", content: "Stage Connect" },
          { property: "og:title", content: `${SEO_TITLE} | Stage Connect` },
          { property: "og:description", content: SEO_DESC },
          ...(canonical ? [{ property: "og:url", content: canonical }] : []),
          ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
          { name: "twitter:card", content: ogImage ? "summary_large_image" : "summary" },
          { name: "twitter:title", content: `${SEO_TITLE} | Stage Connect` },
          { name: "twitter:description", content: SEO_DESC },
          ...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
        ]}
        jsonLd={jsonLdFaq}
      />
      <Breadcrumbs items={[{ label: "配信で観る" }]} />

      {/* --- HERO --- */}
      <div className="mb-16 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-pink/15 blur-[120px] pointer-events-none" />
        <span className="relative inline-block px-4 py-1.5 mb-6 rounded-full bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-sm">
          Streaming Guide
        </span>
        <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">
          2.5次元舞台を
          <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-purple"> 配信で観る</span>
        </h1>
        <p className="relative max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed font-light">
          「どこで配信してる？」「見放題で観れる？」——
          <br />
          2.5次元舞台ファンのための、配信サービス選びガイド。
        </p>
      </div>

      {/* --- DMM PREMIUM: HERO CARD --- */}
      <div className="mb-12 relative">
        <div className="bg-theater-surface/60 border border-neon-pink/20 rounded-2xl p-10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-neon-pink/10 blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black tracking-[0.3em] text-neon-pink uppercase">
                Recommended
              </span>
              <span className="px-2 py-0.5 rounded-full bg-neon-pink/20 border border-neon-pink/30 text-[9px] font-black text-neon-pink">
                2.5次元に強い
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
              DMMプレミアム
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-light max-w-xl mb-6">
              2.5次元舞台・ミュージカルの見放題ラインナップが国内最充実。
              刀剣乱舞、ヒプステ、テニミュ、あんステなど人気シリーズを網羅。
              {dmmSeriesCount && (
                <span className="text-neon-pink font-bold">
                  {` 現在 ${formatCount(dmmSeriesCount)} シリーズが配信中。`}
                </span>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-8">
              <a
                href={DMM_PREMIUM_URL}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="px-8 py-4 rounded-xl bg-neon-pink/20 border border-neon-pink/40 text-white text-sm font-bold hover:bg-neon-pink/30 hover:shadow-[0_0_24px_rgba(233,68,166,0.3)] transition-all"
              >
                14日間無料で始める
              </a>
              <Link
                to="/watch/dmm"
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
              >
                DMM TVで配信中のシリーズを見る →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "月額", value: "550円", note: "(税込)" },
                { label: "無料トライアル", value: "14日間", note: "" },
                { label: "2.5次元 見放題", value: "◎", note: "国内最充実" },
              ].map((stat) => (
                <div key={stat.label} className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] text-slate-500 mb-1">{stat.label}</div>
                  <div className="text-white font-bold text-lg">
                    {stat.value}
                    {stat.note && <span className="text-slate-500 text-xs font-light ml-1">{stat.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- 他のサービスを比較する --- */}
      <div className="mb-12">
        <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
          <span className="w-1 h-6 bg-white/20 rounded-full" />
          他のサービスと比較する
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/watch/u-next"
            className="group bg-theater-surface/40 rounded-2xl border border-white/5 p-8 hover:border-neon-cyan/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.1)] transition-all duration-300"
          >
            <div className="text-[10px] font-black tracking-[0.2em] text-neon-cyan uppercase mb-2">U-NEXT</div>
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-neon-cyan transition-colors">
              U-NEXTと2.5次元舞台
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed font-light mb-4">
              映画・アニメ・ドラマの総合力は高いが、2.5次元舞台の見放題は限定的。メディアミックス作品をまとめて追いたい人向けの比較ガイド。
            </p>
            <span className="text-[10px] text-neon-cyan font-bold tracking-wider uppercase group-hover:underline">
              比較ガイドを読む →
            </span>
          </Link>

          <Link
            to="/watch/danime"
            className="group bg-theater-surface/40 rounded-2xl border border-white/5 p-8 hover:border-neon-purple/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all duration-300"
          >
            <div className="text-[10px] font-black tracking-[0.2em] text-neon-purple uppercase mb-2">dアニメストア</div>
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-neon-purple transition-colors">
              dアニメストアと2.5次元舞台
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed font-light mb-4">
              原作アニメの履修には最強だが、舞台そのものの配信はほぼなし。「原作はdアニメ、舞台はDMM」の二刀流を解説。
            </p>
            <span className="text-[10px] text-neon-purple font-bold tracking-wider uppercase group-hover:underline">
              比較ガイドを読む →
            </span>
          </Link>
        </div>
      </div>

      {/* --- 探し方ガイド --- */}
      <div className="bg-theater-surface/30 border border-white/5 rounded-2xl p-8 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] pointer-events-none" />
        <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
          Stage Connectでの作品の探し方
        </h2>
        <div className="text-slate-400 text-sm leading-relaxed space-y-4 font-light mb-8">
          <p>
            Stage Connect は配信プレイヤーではなく、
            <span className="text-slate-200 font-semibold">2.5次元舞台の横断データベース</span>
            です。作品詳細ページの「視聴する」リンクから各配信サービスへ遷移します。
          </p>
          <p>
            配信先から探すだけでなく、
            <span className="text-slate-200 font-semibold">キャスト / シリーズ年表 / 共演ネットワーク</span>
            からたどることで、次に観る作品が自然に見つかります。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "シリーズから探す",
              desc: "同じ作品世界の舞台をまとめてチェック。年表で時系列も把握できます。",
              to: "/series",
              color: "text-neon-cyan",
            },
            {
              step: "02",
              title: "キャストから探す",
              desc: "推し俳優の出演作一覧から、知らなかった作品に出会えます。",
              to: "/actors",
              color: "text-neon-purple",
            },
            {
              step: "03",
              title: "キーワードで検索",
              desc: "タイトルが曖昧でもOK。検索から作品詳細へ最短ルート。",
              to: "/search",
              color: "text-neon-pink",
            },
          ].map((how) => (
            <Link
              key={how.step}
              to={how.to}
              className="group rounded-xl border border-white/5 bg-black/20 p-6 hover:border-white/20 transition-all"
            >
              <div className={`text-[10px] font-black mb-1 tracking-widest uppercase ${how.color}`}>
                Step {how.step}
              </div>
              <div className="text-white font-bold text-sm mb-2 group-hover:text-white/80 transition-colors">
                {how.title}
              </div>
              <div className="text-slate-400 text-xs leading-relaxed font-light">{how.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* --- FAQ --- */}
      <div className="bg-theater-surface/20 border border-white/5 rounded-2xl p-8">
        <h2 className="text-white font-bold text-lg mb-8 tracking-widest uppercase italic opacity-80">
          FAQ
        </h2>
        <ul className="space-y-8">
          {[
            {
              q: "2.5次元舞台を見放題で観るならどのサービスがおすすめ？",
              a: "2.5次元舞台の見放題ラインナップが最も充実しているのはDMMプレミアムです。14日間の無料トライアルがあるので、まずは配信タイトルを確認してみてください。",
            },
            {
              q: "Stage Connectで動画を再生できますか？",
              a: "Stage Connectは作品データベースです。動画の再生機能はありませんが、作品詳細ページから各配信サービスへのリンクを提供しています。",
            },
            {
              q: "配信状況は常に最新ですか？",
              a: "Stage Connectに登録された配信リンクを元に整理しています。配信状況は変動するため、最終的には遷移先の各サービス公式ページでご確認ください。",
            },
          ].map((faq) => (
            <li key={faq.q} className="group">
              <div className="text-white font-bold text-sm mb-3 flex gap-3">
                <span className="text-neon-pink font-black">Q.</span> {faq.q}
              </div>
              <div className="text-slate-400 text-xs leading-relaxed pl-6 border-l border-white/5 group-hover:border-neon-pink/30 transition-colors font-light">
                {faq.a}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* --- Disclaimer --- */}
      <p className="mt-16 text-[10px] text-slate-700 text-center font-light leading-loose tracking-widest">
        ※Stage Connect に登録された視聴リンクを元に整理しています。
        <br />
        ※配信状況は変わることがあります。最新情報は遷移先の配信ページをご確認ください。
      </p>
    </div>
  );
};

export default WatchIndex;
