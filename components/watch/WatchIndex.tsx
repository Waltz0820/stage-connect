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

  // “DMM ＞ U-NEXT ＞ dアニメ” の導線を固定（ユーザーにとっての入口として分かりやすい順）
  const priorities = useMemo(
    () => [
      {
        key: "dmm",
        label: "DMM TV",
        to: "/watch/dmm",
        title: "DMM TVで観られる2.5次元（シリーズ一覧）",
        desc:
          "配信先で迷ったらまずここ。「2.5次元 配信 どこ？」をシリーズ単位で整理して、作品→俳優→共演へつなぎます。",
        tagMain: "まずチェック",
        tagSub: "シリーズ単位で探しやすい",
        hover: "hover:bg-neon-pink/10",
        labelHoverClass: "group-hover:text-neon-pink",
        tagClass: "bg-neon-pink/10 border-neon-pink/30 text-neon-pink",
        tagSubClass: "bg-white/5 border-white/10 text-slate-300",
        count: dmmSeriesCount,
        countNote: "シリーズ",
      },
      {
        key: "unext",
        label: "U-NEXT",
        to: "/watch/u-next",
        title: "U-NEXTで観られる2.5次元（シリーズ一覧）",
        desc:
          "原作→舞台→関連作までまとめて追いたい人向け。シリーズで履修したい時に強い入口です。",
        tagMain: "世界観まとめ見",
        tagSub: "履修・関連作探し",
        hover: "hover:bg-neon-purple/10",
        labelHoverClass: "group-hover:text-neon-purple",
        tagClass: "bg-neon-purple/10 border-neon-purple/30 text-neon-purple",
        tagSubClass: "bg-white/5 border border-white/10 text-slate-300",
        count: unextSeriesCount,
        countNote: "シリーズ",
      },
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
          「2.5次元の舞台って配信どこで見れる？」に答える、配信サービス別の一覧です。
          <br />
          作品詳細の「視聴する」から外部へ遷移します（Stage Connect内で再生はしません）。
        </p>
      </div>

      {/* Intro / Concept */}
      <div className="bg-theater-surface/40 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
        <h2 className="text-white font-bold text-lg mb-2">配信先から探す、2.5次元の入口</h2>

        <div className="text-slate-300 text-sm leading-relaxed space-y-3">
          <p>
            「舞台 配信 見放題」「ミュージカル 配信 一覧」「見逃し配信 アーカイブ」——
            <br />
            こういう探し方は、サービス名を入れないぶん迷いやすい。そこで Stage Connect では、登録された配信リンクをもとに
            <span className="text-slate-200 font-semibold"> “シリーズ単位” </span>
            で整理して、最短で作品にたどり着けるようにしています。
          </p>

          <p className="text-slate-400">
            入口は「配信」でも、目的地は「作品詳細」です。作品詳細から <span className="text-slate-200 font-semibold">キャスト / 共演 / 年表</span>{" "}
            に寄れるので、「次に観るやつ」が自然に見つかります。
          </p>

          <p className="text-slate-400">
            さらに「テレビで観たい」人は、各サービスの対応デバイス（例：Fire TV / Chromecast など）を使うと、大画面で舞台映像を楽しめます。
            <br />
            ※対応可否や条件は変更されることがあります。最終確認は遷移先をご確認ください。
          </p>
        </div>

        {/* Quick chips（入れすぎない） */}
        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            2.5次元 配信 どこ
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            舞台 配信 見放題
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            見逃し配信 / アーカイブ
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            シリーズ 時系列 / 履修
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            キャスト 出演作 / 共演
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {loadingCounts
              ? "棚の規模: 読み込み中…"
              : `棚の規模: DMM ${formatCount(dmmSeriesCount)} / U-NEXT ${formatCount(unextSeriesCount)} / dアニメ ${formatCount(danimeSeriesCount)}`}
          </span>
        </div>

        {/* How-to Tips */}
        <div className="mt-6 grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-neon-cyan mb-1">TIP</div>
            <div className="text-white font-semibold mb-1">迷ったら「シリーズ」から</div>
            <div className="text-slate-300 text-sm leading-relaxed">
              2.5次元は同一シリーズで体験がつながりやすい。配信先→シリーズ→作品の順で入ると、迷子になりにくいです。
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-neon-cyan mb-1">TIP</div>
            <div className="text-white font-semibold mb-1">俳優で追うと「次」が見つかる</div>
            <div className="text-slate-300 text-sm leading-relaxed">
              作品→出演者→共演…の流れは強い。気になる俳優から過去作へ戻れるのがデータベースの気持ちよさです。
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-neon-cyan mb-1">TIP</div>
            <div className="text-white font-semibold mb-1">作品名が曖昧なら検索</div>
            <div className="text-slate-300 text-sm leading-relaxed">
              うろ覚えでもOK。検索→作品詳細→シリーズへ寄ると、そこから年表やキャストに広がります。
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
          </div>
        </div>

        {/* DMM / U-NEXT cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {priorities.map((p) => (
            <Link key={p.key} to={p.to} className={`group rounded-xl border border-white/10 bg-black/30 p-5 transition-colors ${p.hover}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`text-xs font-bold tracking-widest text-slate-500 ${p.labelHoverClass}`}>{p.label}</div>

                  <div className="mt-1 text-white font-semibold text-lg">{p.title}</div>

                  <div className="mt-2 text-[12px] text-slate-400 leading-relaxed">{p.desc}</div>

                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${p.tagClass}`}>{p.tagMain}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${p.tagSubClass}`}>{p.tagSub}</span>

                    <span className="text-[10px] px-2 py-1 rounded-full bg-black/20 border border-white/10 text-slate-400">
                      {formatCount(p.count)} {p.countNote}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-[11px] text-slate-500 mt-1">一覧 →</div>
              </div>
            </Link>
          ))}
        </div>

        {/* dアニメ */}
        <div className="mt-4">
          <Link to="/watch/danime" className="group block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold tracking-widest text-slate-500">dアニメストア</div>
                <div className="mt-1 text-white font-semibold">dアニメストアで観られる2.5次元（一覧）</div>

                <div className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                  アニメ原作の舞台を探したい時に役立つ入口。作品からキャストやシリーズへ寄って、次を見つけるのが気持ちいい棚です。
                </div>

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">補助的に活用</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-black/20 border border-white/10 text-slate-400">
                    {formatCount(danimeSeriesCount)} シリーズ
                  </span>
                </div>
              </div>

              <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">一覧 →</span>
            </div>
          </Link>
        </div>

        {/* Notes */}
        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-[11px] text-slate-400 leading-relaxed">
            ※この一覧は、Stage Connect に登録された視聴リンクを元に整理しています。
            <br />
            ※配信状況は変わることがあります。最新情報は遷移先の配信ページをご確認ください。
            <br />
            ※当サイトは配信サービスの運営者ではなく、作品データベースとして整理・導線提供を行っています。
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-theater-surface/30 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-white font-bold text-lg mb-3">よくある質問</h2>

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
              変わることがあります。このページは登録されたリンクを元に整理しているため、最終的な配信可否は遷移先でご確認ください。
            </div>
          </li>

          <li>
            <div className="text-white font-semibold">Q. 作品が見つからない時は？</div>
            <div className="text-slate-400 mt-1 leading-relaxed">
              検索 → 作品詳細 → シリーズ（年表）に寄るのが最短です。配信一覧は「入口」なので、見つからない時はDB側から攻めるのが早いです。
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
