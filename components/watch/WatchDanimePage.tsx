import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

const WatchDanimePage: React.FC = () => {
  const breadcrumbs = useMemo(
    () => [
      { label: "配信で観る", to: "/watch" },
      { label: "dアニメストア" },
    ],
    []
  );

  const SEO_TITLE =
    "dアニメストアで2.5次元舞台は観られる？配信状況と舞台ファン向けの選び方";
  const SEO_DESC =
    "dアニメストアで視聴できる2.5次元舞台・ミュージカルの特徴と、舞台ファンに最適な配信サービスの比較ガイド。dアニメとDMMプレミアムの違いを解説。";

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "dアニメストアで2.5次元舞台は観られますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "dアニメストアは主にアニメ配信に特化したサービスで、2.5次元舞台の配信は一部タイトルに限られます。舞台・ミュージカルを中心に視聴したい場合は、DMMプレミアムの方がラインナップが充実しています。",
        },
      },
      {
        "@type": "Question",
        name: "dアニメストアとDMMプレミアム、舞台ファンにはどっちがおすすめ？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "原作アニメを中心に楽しみたいならdアニメストア、2.5次元舞台を見放題で観たいならDMMプレミアムがおすすめです。DMMプレミアムは14日間の無料トライアルがあるので、まずは配信タイトルを確認してみてください。",
        },
      },
      {
        "@type": "Question",
        name: "dアニメストアは2.5次元舞台の原作アニメに強い？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "dアニメストアはアニメに特化しているため、2.5次元舞台の原作アニメは多数配信されています。舞台を観る前後に原作アニメを履修したい場合に便利です。",
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-purple/10 blur-[120px] pointer-events-none" />
        <span className="relative inline-block px-4 py-1.5 mb-6 rounded-full border text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-sm bg-neon-purple/10 border-neon-purple/30 text-neon-purple">
          VOD Comparison Guide
        </span>
        <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter italic uppercase">
          <span className="text-neon-purple">dアニメストア</span> と 2.5次元舞台
        </h1>
        <p className="relative max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed font-light">
          dアニメストアはアニメ配信に特化した国内トップクラスのVOD。
          <br />
          2.5次元舞台の原作アニメを履修するには最適ですが、舞台そのものの配信はどうでしょうか？
        </p>
      </div>

      {/* --- dアニメの特徴 --- */}
      <div className="bg-theater-surface/60 border border-white/5 rounded-2xl p-8 mb-12 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 blur-3xl pointer-events-none" />
        <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
          dアニメストアの特徴と強み
        </h2>
        <div className="text-slate-300 text-sm space-y-5 leading-relaxed font-light">
          <p>
            dアニメストアは
            <span className="text-slate-100 font-bold">月額550円（税込）</span>
            という低価格で、5,700作品以上のアニメが見放題になるサービスです。2.5次元舞台の原作となるアニメ作品を網羅的にカバーしており、
            <span className="text-slate-100 font-bold">「舞台を観る前に原作を予習したい」</span>
            という使い方に最適です。
          </p>
          <p>
            一方で、2.5次元舞台・ミュージカルそのものの配信は
            <span className="text-slate-100 font-bold border-b border-neon-purple/50">ごく一部に限られます</span>。
            dアニメストアはあくまでアニメに特化したサービスであり、実写舞台の配信は主力ジャンルではありません。
          </p>
          <p>
            そのため、「原作アニメはdアニメストアで」「舞台は別のサービスで」という使い分けが、2.5次元ファンにとっては現実的な選択肢です。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {[
            "dアニメストア 2.5次元",
            "dアニメ 舞台 配信",
            "原作アニメ 履修",
            "VOD アニメ 比較",
            "2.5次元 原作 配信",
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
                dアニメストアは「原作アニメを安く大量に観る」には最強の選択肢。でも
                <span className="text-slate-100 font-bold">舞台そのものを観たい</span>
                なら、別のサービスが必要になります。
              </p>
              <p>
                2.5次元舞台の見放題に最も力を入れているのが
                <span className="text-neon-pink font-bold">DMMプレミアム</span>
                。「原作はdアニメで履修 → 舞台はDMMプレミアムで観る」という二刀流が、2.5次元ファンの最適解かもしれません。
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider" />
                    <th className="text-center py-3 px-4 text-[10px] font-black text-neon-purple uppercase tracking-wider">dアニメストア</th>
                    <th className="text-center py-3 px-4 text-[10px] font-black text-neon-pink uppercase tracking-wider">DMMプレミアム</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400 font-light">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-slate-300 font-medium">2.5次元 見放題</td>
                    <td className="py-3 px-4 text-center">ほぼなし</td>
                    <td className="py-3 px-4 text-center text-neon-pink font-bold">◎ 充実</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-slate-300 font-medium">原作アニメ</td>
                    <td className="py-3 px-4 text-center text-neon-purple font-bold">◎ 最強</td>
                    <td className="py-3 px-4 text-center">○</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-slate-300 font-medium">月額料金</td>
                    <td className="py-3 px-4 text-center text-neon-purple font-bold">550円</td>
                    <td className="py-3 px-4 text-center">550円</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-slate-300 font-medium">無料トライアル</td>
                    <td className="py-3 px-4 text-center">31日間</td>
                    <td className="py-3 px-4 text-center text-neon-pink font-bold">14日間</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-medium">おすすめ層</td>
                    <td className="py-3 px-4 text-center text-xs">原作履修派</td>
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
                  q: "dアニメストアで2.5次元舞台は観られますか？",
                  a: "配信されているタイトルはごく一部です。dアニメストアはアニメに特化しているため、2.5次元舞台の視聴には別サービスの併用がおすすめです。",
                },
                {
                  q: "原作アニメの履修にはdアニメストアが一番？",
                  a: "2.5次元舞台の原作となるアニメ作品のカバー率は非常に高く、月額550円でほぼ全て見放題です。原作履修用としては最強の選択肢と言えます。",
                },
                {
                  q: "dアニメストアとDMMプレミアム、両方入るのはアリ？",
                  a: "「原作アニメはdアニメで、舞台はDMMプレミアムで」という使い分けは非常に合理的です。合算しても月額1,100円なので、両方入るファンも多いです。",
                },
              ].map((faq) => (
                <li key={faq.q} className="group">
                  <div className="text-white font-bold text-sm mb-3 flex gap-3">
                    <span className="text-neon-purple font-black">Q.</span> {faq.q}
                  </div>
                  <div className="text-slate-400 text-xs leading-relaxed pl-6 border-l border-white/5 group-hover:border-neon-purple/30 transition-colors font-light">
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
        SYNC ID: DANIME-GUIDE-V3
      </p>
    </div>
  );
};

export default WatchDanimePage;
