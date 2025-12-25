// src/components/watch/WatchIndex.tsx
import React from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";

const WatchIndex: React.FC = () => {
  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title="配信で観る | Stage Connect" robots="index,follow" />
      <Breadcrumbs items={[{ label: "配信で観る", to: "/watch" }]} />

      {/* Hero */}
      <div className="mb-8 text-center">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase">
          WATCH
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">配信で観る</h1>

        <p className="text-slate-400 text-sm leading-relaxed">
          配信サービス別に、観られる2.5次元作品をまとめました。
          <br />
          作品詳細の「視聴する」からは外部サイトへ遷移します（Stage Connect内で再生はしません）。
        </p>
      </div>

      {/* Intro / Concept */}
      <div className="bg-theater-surface/40 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
        <h2 className="text-white font-bold text-lg mb-2">Stage Connectの「配信棚」</h2>

        <p className="text-slate-300 text-sm leading-relaxed">
          2.5次元は、シリーズで追うと強い。けど、気分でふらっと「いま観られるやつ」を探したい日もある。
          <br />
          このページは、配信サービスを起点に作品へ入り、そこから俳優・シリーズへ回遊できる“入口棚”です。
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* DMM */}
          <Link
            to="/watch/dmm"
            className="group rounded-xl border border-white/10 bg-black/30 p-5 hover:bg-neon-pink/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold tracking-widest text-slate-500 group-hover:text-neon-pink">
                  DMM
                </div>
                <div className="mt-1 text-white font-semibold text-lg">DMMで観られる作品</div>

                <div className="mt-2 text-[12px] text-slate-400 leading-relaxed">
                  “まずはここ”の安定棚。配信リンク入力も回しやすく、棚として継続運用しやすいのが強み。
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-neon-pink/10 border border-neon-pink/30 text-neon-pink">
                    主導線
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    入口→作品→俳優へ
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-[11px] text-slate-500 mt-1">一覧 →</div>
            </div>
          </Link>

          {/* U-NEXT */}
          <Link
            to="/watch/u-next"
            className="group rounded-xl border border-white/10 bg-black/30 p-5 hover:bg-neon-purple/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold tracking-widest text-slate-500 group-hover:text-neon-purple">
                  U-NEXT
                </div>
                <div className="mt-1 text-white font-semibold text-lg">U-NEXTで観られる作品</div>

                <div className="mt-2 text-[12px] text-slate-400 leading-relaxed">
                  “観たい”が固まっている人が強い棚。作品→シリーズ→関連作の回遊と相性が良い。
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple">
                    強化枠
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    シリーズ回遊と相性◎
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-[11px] text-slate-500 mt-1">一覧 →</div>
            </div>
          </Link>
        </div>

        {/* dアニメ */}
        <div className="mt-4">
          <Link
            to="/watch/danime"
            className="group block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold tracking-widest text-slate-500">dアニメストア</div>
                <div className="mt-1 text-white font-semibold">dアニメで観られる作品（参考）</div>
                <div className="mt-2 text-[11px] text-slate-400">
                  まずは網羅のために用意。優先度は低めですが、作品数が増えるほど“補助棚”として効いてきます。
                </div>
              </div>

              <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                優先度：低
              </span>
            </div>

            <div className="mt-2 text-[11px] text-slate-500">一覧 →</div>
          </Link>
        </div>

        {/* Notes */}
        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-[11px] text-slate-400 leading-relaxed">
            ※このページの一覧は、Stage Connect の管理画面から登録された視聴リンクを元に作っています。
            <br />
            ※配信状況は変わることがあります。最新情報は遷移先の配信ページをご確認ください。
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-theater-surface/30 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-white font-bold text-lg mb-3">よくあるやつ</h2>

        <ul className="text-slate-300 text-sm space-y-4">
          <li>
            <div className="text-white font-semibold">Q. ここから作品を再生できる？</div>
            <div className="text-slate-400 mt-1 leading-relaxed">
              できません。Stage Connect は作品データベースなので、視聴リンクから各配信サービスへ遷移します。
            </div>
          </li>

          <li>
            <div className="text-white font-semibold">Q. 配信はずっと同じ？</div>
            <div className="text-slate-400 mt-1 leading-relaxed">
              変わることがあります。ここは「登録されたリンク」を元に整理しているため、最終的な配信可否は遷移先でご確認ください。
            </div>
          </li>

          <li>
            <div className="text-white font-semibold">Q. 作品が見つからない時は？</div>
            <div className="text-slate-400 mt-1 leading-relaxed">
              作品一覧 / シリーズ一覧 / 検索を使うのが最短です。配信棚は「いま観られる入口」なので、網羅は順次強化していきます。
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/search"
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
              >
                検索へ
              </Link>
              <Link
                to="/series"
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
              >
                シリーズ一覧へ
              </Link>
              <Link
                to="/plays"
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
              >
                作品一覧へ
              </Link>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WatchIndex;
