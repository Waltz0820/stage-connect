// src/components/watch/WatchIndex.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";

function formatCount(n: number | null | undefined) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString();
}

// view があれば最強（なければ fallback で head:true count を使う）
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
  const [unextSeriesCount, setUnextSeriesCount] = useState<number | null>(null);
  const [danimeSeriesCount, setDanimeSeriesCount] = useState<number | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // “DMM ＞ U-NEXT ＞ dアニメ” の導線を固定（/watch 下の導線に統一）
  const priorities = useMemo(
    () => [
      {
        key: "dmm",
        label: "DMM TV",
        to: "/watch/dmm",
        title: "DMM TVで観られる2.5次元（シリーズ一覧）",
        desc: "配信先で迷ったらまずここ。シリーズ単位で整理して、作品→俳優→共演へつなぎます。",
        tagMain: "まずチェック",
        tagSub: "シリーズ単位で探しやすい",
        hover: "hover:border-neon-pink/50 hover:shadow-[0_0_20px_rgba(233,68,166,0.15)]",
        labelColor: "text-neon-pink",
        tagClass: "bg-neon-pink/10 border-neon-pink/30 text-neon-pink",
        tagSubClass: "bg-white/5 border border-white/10 text-slate-300",
        count: dmmSeriesCount,
        countNote: "シリーズ",
      },
      {
  key: "unext",
  label: "U-NEXT",
  to: "/watch/u-next",
  title: "U-NEXTで観られる2.5次元（シリーズ一覧）",
  desc: "原作→舞台→関連作までまとめて追いたい人向け。シリーズで履修したい時に強い入口です。",
  tagMain: "世界観まとめ見",
  tagSub: "履修・関連作探し",

  // ✅ U-NEXT = シアン（Gemini案に合わせる）
  hover: "hover:border-neon-cyan/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)]",
  labelColor: "text-neon-cyan",
  tagClass: "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan",

  // サブタグは中立でOK（DMMと同じ）
  tagSubClass: "bg-white/5 border border-white/10 text-slate-300",

  count: unextSeriesCount,
  countNote: "シリーズ",
}
    ],
    [dmmSeriesCount, unextSeriesCount]
  );

  useEffect(() => {
    setLoadingCounts(true);
    Promise.all([safeCount("watch_dmm_franchises"), safeCount("watch_unext_franchises"), safeCount("watch_danime_franchises")])
      .then(([dmm, unext, danime]) => {
        setDmmSeriesCount(dmm);
        setUnextSeriesCount(unext);
        setDanimeSeriesCount(danime);
      })
      .finally(() => setLoadingCounts(false));
  }, []);

  const shelfText = loadingCounts
    ? "棚の規模: 読み込み中…"
    : `棚の規模: DMM ${formatCount(dmmSeriesCount)} / U-NEXT ${formatCount(unextSeriesCount)} / dアニメ ${formatCount(danimeSeriesCount)}`;

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title="配信で観る | Stage Connect" robots="index,follow" />
      <Breadcrumbs items={[{ label: "配信で観る", to: "/watch" }]} />

      {/* Hero Section */}
      <div className="mb-12 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon-purple/20 blur-[100px] pointer-events-none" />
        <span className="relative inline-block px-4 py-1.5 mb-6 rounded-full bg-white/5 border border-white/10 text-neon-cyan text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-sm">
          WATCH
        </span>
        <h1 className="relative text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
          配信で観る{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">｜サービス別一覧</span>
        </h1>
        <p className="relative max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed font-light">
          「2.5次元の舞台って配信どこで見れる？」に答える、サービス別アーカイブ。
          <br />
          作品詳細の「視聴する」から外部へ遷移します（Stage Connect内で再生はしません）。
        </p>

        {/* Chips */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {["2.5次元 配信 どこ", "舞台 配信 見放題", "見逃し配信 / アーカイブ", "シリーズ 時系列 / 履修", "キャスト 出演作 / 共演"].map(
            (chip) => (
              <span
                key={chip}
                className="text-[10px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300"
              >
                {chip}
              </span>
            )
          )}
          <span className="text-[10px] px-3 py-1 rounded-full bg-black/20 border border-white/10 text-slate-400">{shelfText}</span>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {priorities.map((p) => (
          <Link
            key={p.key}
            to={p.to}
            className={`group relative flex flex-col bg-theater-surface/60 rounded-2xl border border-white/5 p-8 transition-all duration-500 backdrop-blur-md overflow-hidden ${p.hover}`}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity bg-white" />
            <div className="relative z-10 flex flex-col h-full">
              <div className={`text-[10px] font-black tracking-[0.2em] mb-2 uppercase ${p.labelColor}`}>{p.label}</div>
              <h2 className="text-xl font-bold text-white mb-3">{p.title}</h2>
              <p className="text-slate-400 text-xs leading-relaxed mb-6 flex-grow font-light">{p.desc}</p>

              <div className="flex flex-wrap gap-2 items-center">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${p.tagClass}`}>{p.tagMain}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${p.tagSubClass}`}>{p.tagSub}</span>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    {loadingCounts ? "LOADING..." : `${formatCount(p.count)} ${p.countNote}`}
                  </span>
                  <svg
                    className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* dアニメストア Section */}
      <div className="mb-10">
        <Link
          to="/watch/danime"
          className="group block bg-theater-surface/40 rounded-xl border border-white/5 p-6 hover:border-neon-purple/40 transition-all"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest text-slate-500 mb-1 uppercase">dアニメストア</div>
              <h3 className="text-lg font-bold text-white group-hover:text-neon-purple transition-colors">
                dアニメストアで観られる2.5次元（一覧）
              </h3>
              <p className="mt-2 text-[11px] text-slate-400 font-light leading-relaxed max-w-xl">
                アニメ原作の舞台を探したい時に役立つ入口。作品からキャストやシリーズへ寄って、次を見つけるのが気持ちいい棚です。
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:inline text-[10px] font-mono text-slate-600">
                {loadingCounts ? "—" : `${formatCount(danimeSeriesCount)} シリーズ`}
              </span>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-purple/20 transition-colors">
                <svg className="w-4 h-4 text-slate-400 group-hover:text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Intro / Concept Section */}
      <div className="bg-theater-surface/30 border border-white/5 rounded-2xl p-8 mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] pointer-events-none" />
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-3 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
          配信先から探す、2.5次元の入口
        </h2>

        <div className="text-slate-400 text-sm leading-relaxed space-y-4 font-light">
          <p>
            「舞台 配信 見放題」「ミュージカル 配信 一覧」—— サービス名を入れない探し方は迷いやすい。
            <br />
            Stage Connect では登録リンクをもとに <span className="text-slate-200 font-semibold">“シリーズ単位”</span> で整理し、最短ルートを提供します。
          </p>
          <p className="text-slate-400">
            入口は「配信」でも、目的地は <span className="text-slate-200 font-semibold">「作品詳細」</span> です。作品詳細から{" "}
            <span className="text-slate-200 font-semibold">キャスト / 共演 / 年表</span> に寄れるので、「次に観るやつ」が自然に見つかります。
          </p>
          <p className="text-slate-500">
            ※対応デバイスや視聴条件は変更されることがあります。最終確認は遷移先をご確認ください。
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Link
            to="/search"
            className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            検索へ
          </Link>
          <Link
            to="/series"
            className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            シリーズ一覧へ
          </Link>
          <Link
            to="/plays"
            className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            作品一覧へ
          </Link>
        </div>
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          {
            title: "迷ったらシリーズから",
            text: "2.5次元は同一シリーズで体験が繋がりやすい。配信先→シリーズ→作品の順が王道です。",
            color: "border-neon-purple/30",
          },
          {
            title: "俳優で広げる",
            text: "作品→出演者→共演…の流れは強い。気になる俳優から過去作へ戻れるのがデータベースの気持ちよさです。",
            color: "border-neon-pink/30",
          },
          {
            title: "曖昧なら検索",
            text: "うろ覚えでもOK。検索→作品詳細→シリーズへ寄ると、年表やキャストに広がります。",
            color: "border-neon-cyan/30",
          },
        ].map((tip) => (
          <div key={tip.title} className={`rounded-xl border ${tip.color} bg-white/[0.02] p-6 backdrop-blur-sm`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">TIP</div>
            <div className="text-white font-bold mb-2 text-sm">{tip.title}</div>
            <div className="text-slate-400 text-xs leading-relaxed font-light">{tip.text}</div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="bg-theater-surface/20 border border-white/5 rounded-2xl p-8">
        <h2 className="text-white font-bold text-lg mb-6 tracking-wide">よくある質問</h2>
        <ul className="space-y-6">
          {[
            {
              q: "ここから作品を再生できる？",
              a: "できません。Stage Connect は作品データベースなので、視聴リンクから各配信サービスへ遷移します。",
            },
            {
              q: "配信はずっと同じ？",
              a: "変わることがあります。最終的な配信可否やプラン条件は遷移先の配信ページをご確認ください。",
            },
            {
              q: "作品が見つからない時は？",
              a: "検索 → 作品詳細 → シリーズ（年表）に寄るのが最短です。配信一覧は「入口」なので、見つからない時はDB側から攻めるのが早いです。",
            },
          ].map((faq) => (
            <li key={faq.q}>
              <div className="text-white font-semibold text-sm mb-2 flex gap-2">
                <span className="text-neon-purple font-black">Q.</span> {faq.q}
              </div>
              <div className="text-slate-400 text-xs leading-relaxed pl-5 font-light">{faq.a}</div>
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-3 justify-center">
          <Link
            to="/search"
            className="px-6 py-2 rounded-full bg-neon-purple/20 border border-neon-purple/40 text-white text-[10px] font-bold hover:bg-neon-purple/35 transition-all"
          >
            検索へ
          </Link>
          <Link
            to="/series"
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-bold hover:bg-white/10 transition-all"
          >
            シリーズ一覧へ
          </Link>
          <Link
            to="/plays"
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-bold hover:bg-white/10 transition-all"
          >
            作品一覧へ
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-10 text-[10px] text-slate-600 text-center font-light leading-loose">
        ※Stage Connect に登録された視聴リンクを元に整理しています。
        <br />
        ※配信状況は変わることがあります。最新情報は遷移先の配信ページをご確認ください。
        <br />
        ※当サイトは配信サービスの運営者ではなく、作品データベースとして導線提供を行っています。
      </p>
    </div>
  );
};

export default WatchIndex;
