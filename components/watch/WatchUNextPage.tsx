import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

const WatchUnextPage: React.FC = () => {
  const breadcrumbs = useMemo(
    () => [
      { label: "配信で観る", to: "/watch" },
      { label: "U-NEXT" },
    ],
    []
  );

  const SEO_TITLE =
    "U-NEXTで2.5次元舞台は観られる？配信ラインナップとおすすめの選び方";
  const SEO_DESC =
    "U-NEXTで視聴できる2.5次元舞台・ミュージカルの特徴と、より2.5次元に特化した配信サービスの選び方を解説。舞台ファン目線での比較ガイド。";

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "U-NEXTで2.5次元舞台は観られますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "U-NEXTでも一部の2.5次元舞台作品が配信されています。ただし、舞台のレンタル作品は追加料金がかかる場合があります。2.5次元舞台に特化した見放題ラインナップを求めるなら、DMMプレミアムの方が充実しています。",
        },
      },
      {
        "@type": "Question",
        name: "U-NEXTとDMMプレミアムの違いは？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "U-NEXTは映画・アニメ・ドラマの総合ラインナップが豊富ですが、2.5次元舞台の見放題対象作品は限定的です。DMMプレミアムは2.5次元舞台・ミュージカルの配信数がトップクラスで、見放題対象作品も充実しています。",
        },
      },
      {
        "@type": "Question",
        name: "2.5次元舞台を一番安く観る方法は？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DMMプレミアムなら14日間の無料トライアルがあり、期間中は見放題対象の2.5次元舞台を追加料金なしで視聴できます。まずは無料体験で配信ラインナップを確認するのがおすすめです。",
        },
      },
    ],
  };

  return (
    <div className="container mx-auto px-6 pt-8 pb-32 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead
        title={`${SEO_TITLE} | Stage Connect`}
        description={SEO_DESC}
        robots="index,follow"
        jsonLd={jsonLdFaq}
      />
      <Breadcrumbs items={breadcrumbs} />

      {/* --- HEADER --- */}
      <div className="mb-12 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-cyan/10 blur-[120px] pointer-events-none" />
        <span className="relative inline-block px-4 py-1.5 mb-6 rounded-full border text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-sm bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan">
          VOD Comparison Guide
        </span>
        <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter italic uppercase">
          <span className="text-neon-cyan">U-NEXT</span> と 2.5次元舞台
        </h1>
        <p className="relative max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed font-light">
          U-NEXTは映画・アニメ・ドラマを網羅する国内最大級のVOD。
          <br />
          では、2.5次元舞台ファンにとってベストな選択肢なのか？ 特徴と選び方を整理しました。
        </p>
      </div>

      {/* --- U-NEXTの特徴 --- */}
      <div className="bg-theater-surface/60 border border-white/5 rounded-2xl p-8 mb-12 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl pointer-events-none" />
        <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
          U-NEXTの特徴と強み
        </h2>
        <div className="text-slate-300 text-sm space-y-5 leading-relaxed font-light">
          <p>
            U-NEXTは国内最大級の動画配信サービスで、映画・ドラマ・アニメ・書籍を含む
            <span className="text-slate-100 font-bold">31万本以上</span>
            のコンテンツを配信しています。月額プランには毎月ポイントが付与され、レンタル作品や書籍の購入に充てることができます。
          </p>
          <p>
            2.5次元舞台に関しては、一部作品が見放題対象として配信されているほか、レンタル（追加課金）で視聴できるタイトルも存在します。
            <span className="text-slate-100 font-bold">原作アニメや映画版も同じプラットフォームで視聴</span>
            できるため、メディアミックス作品を横断的に楽しみたい方には利便性の高い環境です。
          </p>
          <p>
            ただし、2.5次元舞台の
            <span className="text-slate-100 font-bold border-b border-neon-cyan/50">見放題対象作品は限定的</span>
            で、観たい舞台がレンタル（別料金）になるケースも少なくありません。舞台を中心に視聴する場合は、実際のラインナップをよく確認してから検討することをおすすめします。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {[
            "U-NEXT 2.5次元",
            "U-NEXT 舞台 配信",
            "U-NEXT ミュージカル",
            "VOD 舞台 比較",
            "2.5次元 見放題",
          ].map((chip) => (
            <span
              key={chip}
              className="text-[10px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 font-mono tracking-wider"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* --- 比較セクション --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
        <div className="lg:col-span-7 space-y-12">
          {/* 比較テーブル */}
          <section className="bg-theater-surface/40 border border-white/5 rounded-2xl p-8">
            <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-neon-pink rounded-full shadow-[0_0_10px_rgba(233,68,166,0.5)]" />
              2.5次元舞台ファンのためのVOD比較
            </h2>
            <div className="text-slate-300 text-sm leading-relaxed font-light space-y-5 mb-8">
              <p>
                2.5次元舞台を中心に観たい場合、VODサービスの選び方は「総合力」ではなく
                <span className="text-slate-100 font-bold">「舞台の見放題ラインナップがどれだけ充実しているか」</span>
                が最重要ポイントです。
              </p>
              <p>
                U-NEXTは総合VODとして映画やアニメに強い一方、2.5次元舞台の見放題対象は限られています。一方、
                <span className="text-neon-pink font-bold">DMMプレミアム</span>
                は2.5次元舞台・ミュージカルの配信に注力しており、見放題で視聴できるタイトル数はトップクラスです。
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider" />
                    <th className="text-center py-3 px-4 text-[10px] font-black text-neon-cyan uppercase tracking-wider">U-NEXT</th>
                    <th className="text-center py-3 px-4 text-[10px] font-black text-neon-pink uppercase tracking-wider">DMMプレミアム</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400 font-light">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-slate-300 font-medium">2.5次元 見放題</td>
                    <td className="py-3 px-4 text-center">一部</td>
                    <td className="py-3 px-4 text-center text-neon-pink font-bold">◎ 充実</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-slate-300 font-medium">無料トライアル</td>
                    <td className="py-3 px-4 text-center">31日間</td>
                    <td className="py-3 px-4 text-center text-neon-pink font-bold">14日間</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-slate-300 font-medium">アニメ・映画</td>
                    <td className="py-3 px-4 text-center text-neon-cyan font-bold">◎ 強い</td>
                    <td className="py-3 px-4 text-center">○</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-slate-300 font-medium">舞台レンタル</td>
                    <td className="py-3 px-4 text-center">多数（別料金）</td>
                    <td className="py-3 px-4 text-center">一部</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-medium">おすすめ層</td>
                    <td className="py-3 px-4 text-center text-xs">総合エンタメ派</td>
                    <td className="py-3 px-4 text-center text-xs text-neon-pink font-bold">舞台ファン</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section className="bg-theater-surface/30 border border-white/5 rounded-2xl p-8">
            <h2 className="text-white font-bold text-lg mb-8 tracking-widest uppercase italic opacity-80">
              FAQ
            </h2>
            <ul className="space-y-8">
              {[
                {
                  q: "U-NEXTで2.5次元舞台は観られますか？",
                  a: "一部作品は配信されていますが、見放題対象は限定的です。レンタル（追加課金）作品が中心となる場合もあるため、観たい舞台が見放題に含まれるかは事前に確認をおすすめします。",
                },
                {
                  q: "2.5次元舞台を見放題で観るならどこがおすすめ？",
                  a: "2.5次元舞台の見放題ラインナップで選ぶなら、DMMプレミアムが最も充実しています。14日間の無料トライアルがあるので、まずは配信タイトルを確認してみるのがおすすめです。",
                },
                {
                  q: "U-NEXTのポイントで舞台のレンタルはできる？",
                  a: "月額プランに付与されるポイントでレンタル作品を視聴することは可能です。ただし、ポイントには有効期限があるため計画的な利用が必要です。",
                },
              ].map((faq) => (
                <li key={faq.q} className="group">
                  <div className="text-white font-bold text-sm mb-3 flex gap-3">
                    <span className="text-neon-cyan font-black">Q.</span> {faq.q}
                  </div>
                  <div className="text-slate-400 text-xs leading-relaxed pl-6 border-l border-white/5 group-hover:border-neon-cyan/30 transition-colors font-light">
                    {faq.a}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* --- SIDEBAR: DMM Premium CTA --- */}
        <div className="lg:col-span-5">
          <div className="bg-theater-surface/50 border border-neon-pink/20 rounded-2xl p-8 sticky top-24 backdrop-blur-md">
            <h3 className="text-[10px] font-black text-neon-pink tracking-[0.3em] uppercase mb-2">
              Recommended for 2.5D Fans
            </h3>
            <p className="text-white font-bold text-lg mb-3">
              2.5次元舞台を見放題で楽しむなら
            </p>
            <p className="text-slate-400 text-sm font-light leading-relaxed mb-6">
              DMMプレミアムなら、2.5次元舞台・ミュージカルの見放題ラインナップが充実。
              まずは14日間の無料トライアルで、推し作品が配信されているかチェックしてみてください。
            </p>
            <p className="text-[11px] text-neon-pink font-bold tracking-wide mb-3">
              ✦ 14日間無料でお試し
            </p>
            <a
              href={DMM_PREMIUM_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="block w-full text-center px-6 py-4 rounded-xl bg-neon-pink/20 border border-neon-pink/40 text-white text-sm font-bold hover:bg-neon-pink/30 hover:shadow-[0_0_20px_rgba(233,68,166,0.3)] transition-all"
            >
              DMMプレミアムを無料で始める
            </a>

            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
              <Link
                to="/watch/dmm"
                className="flex items-center justify-between w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-neon-pink/10 hover:border-neon-pink/30 transition-all group"
              >
                DMM TVで配信中の作品を見る
                <svg
                  className="w-4 h-4 text-slate-600 group-hover:text-neon-pink transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                to="/series"
                className="flex items-center justify-between w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all group"
              >
                シリーズ一覧へ
                <svg
                  className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-20 text-[10px] text-slate-700 text-center font-light leading-loose tracking-widest uppercase">
        ※Stage Connect Media Database | VOD Comparison Guide
        <br />
        SYNC ID: UNEXT-GUIDE-V3
      </p>
    </div>
  );
};

export default WatchUnextPage;
