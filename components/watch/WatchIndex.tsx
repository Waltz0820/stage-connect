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

      <div className="mb-8 text-center">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase">
          WATCH
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">配信で観る</h1>
        <p className="text-slate-400 text-sm">
          配信サービス別に、観られる作品をまとめました（作品詳細の視聴リンクは外部へ遷移します）
        </p>
      </div>

      <div className="bg-theater-surface/40 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
        <h2 className="text-white font-bold text-lg mb-2">Stage Connectの「配信棚」</h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          「シリーズで追う」だけだと、気分で作品を探しにくい日がある。
          <br />
          ここは、配信サービスを起点に“今すぐ観られる”作品へ寄れる棚です。
        </p>

        {/* 2強を優先表示 */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/watch/dmm"
            className="group rounded-xl border border-white/10 bg-black/30 p-5 hover:bg-neon-pink/10 transition-colors"
          >
            <div className="text-xs font-bold tracking-widest text-slate-500 group-hover:text-neon-pink">DMM</div>
            <div className="mt-1 text-white font-semibold text-lg">DMMで観られる作品</div>
            <div className="mt-1 text-[11px] text-slate-500">一覧 →</div>
            <div className="mt-2 text-[11px] text-slate-400">
              ※いちばん安定して運用できる主導線
            </div>
          </Link>

          <Link
            to="/watch/u-next"
            className="group rounded-xl border border-white/10 bg-black/30 p-5 hover:bg-neon-purple/10 transition-colors"
          >
            <div className="text-xs font-bold tracking-widest text-slate-500 group-hover:text-neon-purple">U-NEXT</div>
            <div className="mt-1 text-white font-semibold text-lg">U-NEXTで観られる作品</div>
            <div className="mt-1 text-[11px] text-slate-500">一覧 →</div>
            <div className="mt-2 text-[11px] text-slate-400">
              ※案件が取れる時に強い（1480円帯の伸び）
            </div>
          </Link>
        </div>

        {/* 参考枠：dアニメ（優先度最下層） */}
        <div className="mt-4">
          <Link
            to="/watch/danime"
            className="group block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold tracking-widest text-slate-500">dアニメストア</div>
                <div className="mt-1 text-white font-semibold">dアニメで観られる作品（参考）</div>
                <div className="mt-1 text-[11px] text-slate-500">一覧 →</div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                優先度：低
              </span>
            </div>
          </Link>
        </div>
      </div>

      <div className="bg-theater-surface/30 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-white font-bold text-lg mb-2">よくあるやつ</h2>
        <ul className="text-slate-300 text-sm space-y-3">
          <li>
            <span className="text-white font-semibold">Q.</span> 配信は常に同じ？
            <br />
            <span className="text-slate-400">
              作品の配信状況は変わることがあります。ここは「Stage Connect に登録された視聴リンク」を元にまとめています。
            </span>
          </li>
          <li>
            <span className="text-white font-semibold">Q.</span> 作品詳細の「視聴する」は？
            <br />
            <span className="text-slate-400">外部サイトへ直接遷移します（分かりやすいCTAに寄せます）。</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WatchIndex;
