// src/components/watch/WatchDmmPage.tsx
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
  key: string; // slug優先。なければname
  playsCount: number;
};

const PAGE_SIZE = 10;

const WatchDmmPage: React.FC = () => {
  const [items, setItems] = useState<FranchiseItem[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // 検索（ロード済み分に対するフィルタ）
  const [q, setQ] = useState("");

  // 競合防止
  const seqRef = useRef(0);

  const breadcrumbs = useMemo(
    () => [
      { label: "配信で観る", to: "/watch" },
      { label: "DMM TV", to: "/watch/dmm" },
    ],
    []
  );

  const BADGE_CLASS = "bg-neon-pink/10 border-neon-pink/30 text-neon-pink";
  const CARD_HOVER =
    "hover:border-neon-pink/40 hover:shadow-[0_0_20px_rgba(233,68,166,0.15)]";
  const INPUT_FOCUS =
    "focus:border-neon-pink/40 focus:ring-2 focus:ring-neon-pink/20";

  const DMM_FALLBACK_URL = "https://tv.dmm.com/vod/";
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
      .from("watch_dmm_franchises")
      .select("franchise_id", { count: "exact", head: true });

    if (res.error) return;
    if (typeof res.count === "number") setTotalCount(res.count);
  };

  const fetchPage = async (nextPage: number) => {
    const mySeq = ++seqRef.current;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const res = await supabase
      .from("watch_dmm_franchises")
      .select("franchise_id, name, slug, plays_count")
      .order("plays_count", { ascending: false })
      .order("name", { ascending: true })
      .range(from, to);

    if (mySeq !== seqRef.current) return;

    if (res.error) {
      console.warn("[watch/dmm] fetch error", res.error);
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
  const SEO_TITLE = `2.5次元舞台の配信が特に充実！DMM TVで見られるシリーズ一覧とおすすめ【現在${countLabel}シリーズ】`;
  const LIST_TITLE = "DMM TVで観られる2.5次元作品（シリーズ一覧）";

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title={`${SEO_TITLE} | Stage Connect`} robots="index,follow" />
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="mb-6 text-center">
        <span
          className={`inline-block px-3 py-1 mb-4 rounded-full border text-xs font-bold tracking-widest uppercase ${BADGE_CLASS}`}
        >
          DMM TV
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          {SEO_TITLE}
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed">
          DMM TVで視聴できる2.5次元舞台・ミュージカルを、
          <span className="text-slate-300">シリーズ単位</span>で整理しました。
          <br />
          作品詳細からキャスト・共演・年表へつなげて、「次に観る一本」まで見つけやすくしています。
          <br />
          <span className="text-slate-500">最終更新：{UPDATED}</span>
        </p>
      </div>

      {/* Top SEO block */}
      <div className="bg-theater-surface/40 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
        <h2 className="text-white font-bold text-lg mb-3">
          2.5次元の配信先で迷ったら、まずDMM TV
        </h2>

        <div className="text-slate-300 text-sm space-y-3 leading-relaxed">
          <p>
            「2.5次元 配信 どこ」「舞台 配信 見放題」「ミュージカル 映像 サブスク」。
            <br />
            こういう探し方をしている人は、まず <span className="text-slate-200 font-semibold">DMM TV</span>{" "}
            をチェックしておくと効率が良いです。2.5次元まわりの作品が見つけやすい導線が用意されていて、
            “配信で観る”入口として選びやすいのが強みです。
          </p>

          <p>
            このページは、Stage Connect に登録された配信リンク（DMM TV）を元に、
            <span className="text-slate-200 font-semibold">シリーズごと</span>に集約して一覧化しています。
            「気になっていたシリーズ」や「推しの出演作」から入って、作品詳細→俳優→共演へ回遊できます。
          </p>

          <p className="text-slate-400">
            ※配信状況・料金・無料体験の条件は変更される場合があります。最終確認は遷移先の公式ページをご確認ください。
          </p>
        </div>

        {/* Search-intent chips */}
        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            2.5次元 配信 どこ
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            舞台 配信 見放題
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            ミュージカル 配信 一覧
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            2.5次元 アーカイブ
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            推し 出演作 配信
          </span>
        </div>

        {/* Use guide */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="text-white font-bold text-base mb-3">
            {LIST_TITLE} の見方
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-neon-pink mb-1">
                HOW 1
              </div>
              <div className="text-white font-semibold mb-1">シリーズから入る</div>
              <div className="text-slate-300 text-sm leading-relaxed">
                タイトルが多いほど、シリーズ単位の方が迷いにくい。まずはシリーズ一覧で当たりを付けるのが最短です。
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-neon-pink mb-1">
                HOW 2
              </div>
              <div className="text-white font-semibold mb-1">作品詳細で深掘る</div>
              <div className="text-slate-300 text-sm leading-relaxed">
                作品詳細からキャスト・共演・年表へ。配信だけで終わらず「次に観る一本」が見つかりやすい設計です。
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-neon-pink mb-1">
                HOW 3
              </div>
              <div className="text-white font-semibold mb-1">名前が曖昧なら検索</div>
              <div className="text-slate-300 text-sm leading-relaxed">
                うろ覚えでもOK。検索 → 作品詳細 → シリーズに寄ると回遊が速いです。
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Link
              to="/watch"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
            >
              /watch に戻る
            </Link>
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
            <a
              href={DMM_FALLBACK_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
            >
              DMM TVを開く ↗
            </a>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-theater-surface/30 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            LIST
          </div>
          <div className="text-[10px] text-slate-500">
            {loading
              ? "読み込み中..."
              : `${(totalCount ?? filtered.length).toLocaleString()} シリーズ`}
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-4 border-b border-white/5 bg-black/10">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="シリーズ名で絞り込み（例：刀剣乱舞 / テニミュ）"
            className={`w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none ${INPUT_FOCUS} transition`}
          />
          <div className="mt-2 text-[11px] text-slate-500">
            ※DMM TVの配信リンクが登録されている作品があるシリーズのみ表示されます。
          </div>
        </div>

        {loading && <div className="p-10 text-center text-slate-500">読み込み中...</div>}

        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            該当するシリーズが見つかりませんでした。別のキーワードでお試しください。
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

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>配信リンク登録作品：{it.playsCount} 件</span>
                        <span className="text-slate-700">/</span>
                        <span>シリーズ詳細から作品一覧へ</span>
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

      {/* Bottom: CV/SEO */}
      <div className="mt-8 bg-theater-surface/30 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-white font-bold text-lg mb-2">
          まず試しやすい価格帯。視聴環境も作りやすい
        </h2>

        <div className="text-slate-300 text-sm space-y-3 leading-relaxed">
          <p>
            DMM TVは月額料金が比較的始めやすい価格帯で、2.5次元の配信を「まず体験してみる」入口として選びやすいのが特徴です。
            <br />
            週末にまとめて観る、遠征の移動時間に消化するなど、サブスクの使い方と相性が良いサービスです。
          </p>

          <p>
            また、スマホ視聴だけでなく、テレビの大画面で観たい派にも向いています。
            対応機器や視聴方法は時期により更新されることがあるため、手元の端末で視聴できるかだけ事前に確認しておくと安心です。
          </p>

          <p className="text-slate-400">
            ※無料体験の有無・期間・対象は時期により変動する場合があります。最新の条件は公式でご確認ください。
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={DMM_FALLBACK_URL}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            DMM TVを開く ↗
          </a>
          <Link
            to="/search"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            作品検索へ
          </Link>
          <Link
            to="/plays"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            作品一覧へ
          </Link>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="text-white font-bold text-sm mb-3">よくある質問</h3>
          <ul className="text-slate-300 text-sm space-y-3">
            <li>
              <span className="text-slate-400">Q.</span>{" "}
              ここに載っているシリーズは、必ずDMM TVで観られますか？
              <br />
              <span className="text-slate-500">
                A. 登録された配信リンクを元に整理しています。配信状況は変わるため、最終的には遷移先でご確認ください。
              </span>
            </li>
            <li>
              <span className="text-slate-400">Q.</span> シリーズ一覧に無い作品は？
              <br />
              <span className="text-slate-500">
                A. 配信リンクが未登録、または配信が終了している可能性があります。作品検索から探すのもおすすめです。
              </span>
            </li>
            <li>
              <span className="text-slate-400">Q.</span> 作品一覧ではなくシリーズ一覧なのは？
              <br />
              <span className="text-slate-500">
                A. 2.5次元はシリーズ単位で繋がりやすく、迷いにくいからです。シリーズ詳細から作品→俳優へ自然に回遊できます。
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WatchDmmPage;
