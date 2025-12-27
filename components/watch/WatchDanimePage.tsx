// src/components/watch/WatchDanimePage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";

type WatchFranchiseRow = {
  franchise_id: string;
  name: string | null;
  slug: string | null;
  plays_count: number | null;
};

type FranchiseItem = {
  id: string;
  name: string;
  key: string;
  playsCount: number;
};

const PAGE_SIZE = 10;

const WatchDanimePage: React.FC = () => {
  const [items, setItems] = useState<FranchiseItem[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [q, setQ] = useState("");

  const seqRef = useRef(0);

  const breadcrumbs = useMemo(
    () => [
      { label: "配信で観る", to: "/watch" },
      { label: "dアニメストア", to: "/watch/danime" },
    ],
    []
  );

  const BADGE_CLASS = "bg-emerald-400/10 border-emerald-300/30 text-emerald-300";
  const CARD_HOVER =
    "hover:border-emerald-300/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.14)]";

  const DANIME_FALLBACK_URL = "https://animestore.docomo.ne.jp/";
  const UPDATED = new Date().toLocaleDateString("ja-JP");

  const normalize = (r: WatchFranchiseRow): FranchiseItem | null => {
    const name = (r.name ?? "").trim();
    const slug = (r.slug ?? "").trim();
    const key = slug || name;
    if (!name || !key) return null;

    const playsCount = typeof r.plays_count === "number" ? r.plays_count : 0;
    return { id: r.franchise_id, name, key, playsCount };
  };

  const fetchTotal = async () => {
    const res = await supabase
      .from("watch_danime_franchises")
      .select("franchise_id", { count: "exact", head: true });
    if (!res.error && typeof res.count === "number") setTotalCount(res.count);
  };

  const fetchPage = async (nextPage: number) => {
    const mySeq = ++seqRef.current;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const res = await supabase
      .from("watch_danime_franchises")
      .select("franchise_id, name, slug, plays_count")
      .order("plays_count", { ascending: false })
      .order("name", { ascending: true })
      .range(from, to);

    if (mySeq !== seqRef.current) return;

    if (res.error) {
      console.warn("[watch/danime] fetch error", res.error);
      setHasMore(false);
      return;
    }

    const raw: WatchFranchiseRow[] = (res.data as any) ?? [];
    const normalized = raw.map(normalize).filter(Boolean) as FranchiseItem[];

    if (raw.length < PAGE_SIZE) setHasMore(false);

    if (nextPage === 0) setItems(normalized);
    else setItems((prev) => [...prev, ...normalized]);

    setPage(nextPage);
  };

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    setQ("");

    setLoading(true);
    Promise.all([fetchTotal(), fetchPage(0)]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (!hasMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => it.name.toLowerCase().includes(s));
  }, [items, q]);

  const countLabel = (totalCount ?? filtered.length).toLocaleString();

  const SEO_TITLE = `月額でアニメも2.5次元も。dアニメストアで見られる舞台シリーズ一覧【現在${countLabel}シリーズ】`;

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title={`${SEO_TITLE} | Stage Connect`} robots="index,follow" />
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="mb-6 text-center">
        <span
          className={`inline-block px-3 py-1 mb-4 rounded-full border text-xs font-bold tracking-widest uppercase ${BADGE_CLASS}`}
        >
          dアニメストア
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{SEO_TITLE}</h1>

        <p className="text-slate-400 text-sm leading-relaxed">
          Stage Connect に登録された配信リンク（dアニメストア）をもとに、
          <span className="text-slate-300">シリーズ単位</span>で整理しています。
          <br />
          視聴ボタンからは外部サイトへ遷移します（Stage Connect 内での再生はありません）。
          <br />
          （最終更新：{UPDATED}）
        </p>
      </div>

      {/* Intro */}
      <div className="bg-theater-surface/40 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
        <h2 className="text-white font-bold text-lg mb-3">
          「2.5次元 舞台 配信 どこで見れる？」に、ひとつ答えを増やす棚
        </h2>

        <div className="text-slate-300 text-sm space-y-3 leading-relaxed">
          <p>
            dアニメストアはアニメの印象が強い一方で、アニメ原作のメディアミックスとして
            <span className="text-slate-200 font-semibold">2.5次元舞台・ミュージカルが配信対象になっていること</span>
            もあります。
          </p>

          <p>
            ただ、サービス内検索だけだと「舞台」「2.5次元」「○○ 配信」みたいな探し方がしづらい時もある。
            そこでこのページでは、Stage Connect 側のデータベースを使って
            <span className="text-slate-200 font-semibold">“舞台シリーズ”を入口にして探せる形</span>にまとめています。
          </p>
        </div>

        {/* Keyword chips */}
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-[11px] text-slate-400 mb-3">
            こんな検索でたどり着いた人向け（例）
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "2.5次元 舞台 配信",
              "舞台 配信 サブスク",
              "ミュージカル 配信",
              "アニメ原作 舞台 配信",
              "テニミュ 配信",
              "ヒプステ 配信",
              "刀剣乱舞 舞台 配信",
              "舞台 どこで見れる",
            ].map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            ※作品名が曖昧でもOK。まずはシリーズを開いて、作品一覧→キャスト→関連作へ回遊できます。
          </div>
        </div>

        {/* How to use */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="text-white font-bold text-lg mb-3">このページの使い方</h3>

          <div className="text-slate-300 text-sm space-y-2 leading-relaxed">
            <p>・「シリーズ詳細」：Stage Connect 内（作品一覧 / キャスト / 年表へ）</p>
            <p>・「dアニメストアを開く」：外部サイトへ（別タブ推奨）</p>
            <p className="text-slate-400">
              ※配信状況は変わることがあります。最終的な配信可否は遷移先でご確認ください。
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Link
              to="/watch"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
            >
              /watch に戻る
            </Link>
            <Link
              to="/series"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
            >
              シリーズ一覧へ
            </Link>
            <Link
              to="/search"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
            >
              検索へ
            </Link>
            <a
              href={DANIME_FALLBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
            >
              dアニメストアを開く ↗
            </a>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-theater-surface/30 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">LIST</div>
          <div className="text-[10px] text-slate-500">
            {loading ? "読み込み中..." : `${(totalCount ?? filtered.length).toLocaleString()} シリーズ`}
          </div>
        </div>

        {/* Filter */}
        <div className="px-5 py-4 border-b border-white/5 bg-black/10">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="シリーズ名で絞り込み（例：テニミュ / ヒプステ / 刀剣乱舞 など）"
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-300/40 focus:ring-2 focus:ring-emerald-300/20 transition"
          />
          <div className="mt-2 text-[11px] text-slate-500">
            ※表示はシリーズ単位（dアニメストアの視聴リンクが登録されている作品があるシリーズのみ）。
          </div>
        </div>

        {loading && <div className="p-10 text-center text-slate-500">読み込み中...</div>}

        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            該当するシリーズが見つかりませんでした。<br />
            表記ゆれがありそうな場合は、短い単語（例：「刀剣」「テニミュ」）で試してみてください。
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="p-4 sm:p-5 grid grid-cols-1 gap-3">
            {filtered.map((it) => {
              const seriesHref = `/series/${encodeURIComponent(it.key)}`;
              return (
                <div
                  key={it.id}
                  className={`rounded-xl border border-white/10 bg-black/30 p-4 transition-all duration-300 ${CARD_HOVER}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={seriesHref}
                        className="block text-white font-semibold leading-snug hover:underline truncate"
                      >
                        {it.name}
                      </Link>
                      <div className="mt-1 text-[11px] text-slate-500">
                        dアニメストアのリンク登録作品：{it.playsCount} 件
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        to={seriesHref}
                        className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[11px] font-bold hover:bg-white/10 transition-colors text-center"
                      >
                        シリーズ詳細 →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && !loading && (
          <div className="p-4 border-t border-white/5 bg-black/20">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full px-4 py-3 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? "読み込み中..." : "もっと見る"}
            </button>
          </div>
        )}
      </div>

      {/* Pricing / Trial */}
      <div className="mt-8 bg-theater-surface/30 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-white font-bold text-lg mb-2">料金・無料期間は「申込経路」で変わる（改定予定あり）</h2>

        <div className="text-slate-300 text-sm space-y-3 leading-relaxed">
          <p>
            dアニメストアは、月額で「アニメ＋関連コンテンツ（ライブ/ミュージカル等）」まで触れられるのが魅力です。
            ただし、月額料金や無料期間は<span className="text-slate-200 font-semibold">申込経路（ブラウザ/アプリ）</span>で条件が変わります。
          </p>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-white font-semibold mb-2">目安（公式案内ベース）</div>
            <ul className="text-slate-300 text-sm space-y-2">
              <li className="text-slate-300">
                ・ブラウザ等（ドコモの申込）：
                <span className="text-slate-200 font-semibold">月額550円（税込）</span>
                → <span className="text-slate-200 font-semibold">2026年2月1日から月額660円（税込）</span>
              </li>
              <li className="text-slate-300">
                ・App Store / Google Play：
                <span className="text-slate-200 font-semibold">月額650円（税込）</span>
                → <span className="text-slate-200 font-semibold">月額760円（税込）</span>
                （改定日が異なります）
              </li>
              <li className="text-slate-500">
                ※App Store：2026年2月1日より改定 / Google Play：2026年2月10日より改定（契約日によっては改定後料金が先に適用される場合あり）
              </li>
              <li className="text-slate-500">
                ※初回無料は「7日間」や、申込経路によって「14日間」等になる場合があります。
              </li>
            </ul>
          </div>

          <p className="text-slate-400">
            ※料金・無料期間・配信状況は変更されることがあります。最終的な条件は必ず公式の案内をご確認ください。
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={DANIME_FALLBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            dアニメストアを開く ↗
          </a>
          <Link
            to="/guide"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            観劇ガイドへ
          </Link>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="text-white font-bold text-sm mb-3">よくある質問</h3>
          <ul className="text-slate-300 text-sm space-y-3">
            <li>
              <span className="text-slate-400">Q.</span> ここに載っているシリーズは、今も必ず視聴できますか？
              <br />
              <span className="text-slate-500">
                A. Stage Connect に登録されたリンクを元に整理しています。配信は入れ替わるため、最終的には遷移先でご確認ください。
              </span>
            </li>
            <li>
              <span className="text-slate-400">Q.</span> シリーズから入るメリットは？
              <br />
              <span className="text-slate-500">
                A. 作品→キャスト→関連作の流れが作りやすく、「次に観るもの」が見つかりやすいからです。
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WatchDanimePage;
