// src/components/watch/WatchUNextPage.tsx
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

const WatchUNextPage: React.FC = () => {
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
      { label: "U-NEXT", to: "/watch/u-next" },
    ],
    []
  );

  const BADGE_CLASS = "bg-sky-400/10 border-sky-300/30 text-sky-300";
  const CARD_HOVER =
    "hover:border-sky-300/40 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]";
  const INPUT_FOCUS = "focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/20";

  const UNEXT_FALLBACK_URL = "https://video.unext.jp/";
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
      .from("watch_unext_franchises")
      .select("franchise_id", { count: "exact", head: true });
    if (!res.error && typeof res.count === "number") setTotalCount(res.count);
  };

  const fetchPage = async (nextPage: number) => {
    const mySeq = ++seqRef.current;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const res = await supabase
      .from("watch_unext_franchises")
      .select("franchise_id, name, slug, plays_count")
      .order("plays_count", { ascending: false })
      .order("name", { ascending: true })
      .range(from, to);

    if (mySeq !== seqRef.current) return;

    if (res.error) {
      console.warn("[watch/u-next] fetch error", res.error);
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

  const SEO_TITLE = `原作アニメも舞台版もまとめて楽しむなら。U-NEXTで見られる2.5次元シリーズまとめ【現在${countLabel}シリーズ】`;

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title={`${SEO_TITLE} | Stage Connect`} robots="index,follow" />
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="mb-6 text-center">
        <span
          className={`inline-block px-3 py-1 mb-4 rounded-full border text-xs font-bold tracking-widest uppercase ${BADGE_CLASS}`}
        >
          U-NEXT
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          {SEO_TITLE}
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed">
          U-NEXTで視聴できる2.5次元舞台・ミュージカルを、
          <span className="text-slate-300">シリーズ単位</span>で整理しました。
          <br />
          作品詳細からキャスト・共演・年表へつなげて、舞台→原作（アニメ/映画）まで回遊しやすい入口にしています。
          <br />
          <span className="text-slate-500">最終更新：{UPDATED}</span>
        </p>
      </div>

      {/* Top SEO block */}
      <div className="bg-theater-surface/40 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
        <h2 className="text-white font-bold text-lg mb-3">
          U-NEXTが刺さるのは「世界観をまとめて追う人」
        </h2>

        <div className="text-slate-300 text-sm space-y-3 leading-relaxed">
          <p>
            「舞台を観てから原作アニメを履修したい」「原作ファンとして舞台版も見たい」。
            <br />
            そんな<span className="text-slate-200 font-semibold">“作品世界をまとめて追いかけたい人”</span>
            に向いているのがU-NEXTです。
          </p>

          <p>
            同じシリーズでも、舞台だけ追うか、アニメ・映画・関連映像まで追うかで“満足度の伸び方”が変わります。
            <br />
            U-NEXTは映像ラインが強いタイトルが多く、
            <span className="text-slate-200 font-semibold">「探す」「移動する」手間が減る</span>
            のが嬉しいポイントです。
          </p>

          <p className="text-slate-400">
            ※このページは Stage Connect に登録された配信リンク（U-NEXT）を元に整理しています。配信状況は変わる場合があります。
          </p>
        </div>

        {/* Search-intent chips */}
        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            2.5次元 配信 U-NEXT
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            舞台 アニメ まとめて
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            原作 履修 順番
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            シリーズ 一気見
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            メディアミックス 配信
          </span>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="text-white font-bold text-base mb-3">このページの使い方</h3>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-sky-300 mb-1">
                HOW 1
              </div>
              <div className="text-white font-semibold mb-1">シリーズで当たりを付ける</div>
              <div className="text-slate-300 text-sm leading-relaxed">
                まずシリーズ一覧で探す → 作品詳細へ。舞台だけでなく、関連映像まで“追う前提”の人ほど効きます。
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-sky-300 mb-1">
                HOW 2
              </div>
              <div className="text-white font-semibold mb-1">作品詳細からキャストへ</div>
              <div className="text-slate-300 text-sm leading-relaxed">
                推しの出演作→共演…の流れで、次の作品が見つかりやすい。回遊しながら“視聴計画”が立ちます。
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-sky-300 mb-1">
                HOW 3
              </div>
              <div className="text-white font-semibold mb-1">うろ覚えなら検索</div>
              <div className="text-slate-300 text-sm leading-relaxed">
                タイトルが曖昧でもOK。検索 → 作品詳細 → シリーズに寄るのが最短です。
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
              href={UNEXT_FALLBACK_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
            >
              U-NEXTを開く ↗
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

        <div className="px-5 py-4 border-b border-white/5 bg-black/10">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="シリーズ名で絞り込み（例：ヒプステ / テニミュ）"
            className={`w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none ${INPUT_FOCUS} transition`}
          />
          <div className="mt-2 text-[11px] text-slate-500">
            ※表示はシリーズ単位（U-NEXTリンクが登録されている作品があるシリーズのみ）。
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

      {/* Bottom: points / trial / reassurance */}
      <div className="mt-8 bg-theater-surface/30 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-white font-bold text-lg mb-2">
          “月額が高い”を、ポイント込みで考える
        </h2>

        <div className="text-slate-300 text-sm space-y-3 leading-relaxed">
          <p>
            U-NEXTは月額料金が高めに見えますが、月額プランにはポイントが付与される仕組みがあります。
            <br />
            ポイントを使う前提なら、体感の負担は変わります。舞台だけでなく映画・アニメ・関連映像も見る人ほど、
            「まとめて管理できる」メリットが出やすいです。
          </p>

          <p>
            まずは無料トライアルが用意されていることがあるので、条件が合うタイミングならそれを使うのが最短です。
            特典内容（無料期間・付与ポイントなど）は時期により変動する場合があるため、登録前に公式の案内を確認してください。
          </p>

          <p className="text-slate-400">
            ※料金・ポイント・無料期間は変更されることがあります。最終的な条件は公式でご確認ください。
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            U-NEXT 2.5次元
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            原作 アニメ 舞台 順番
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            舞台 配信 高画質
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <a
            href={UNEXT_FALLBACK_URL}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            U-NEXTを開く ↗
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
              <span className="text-slate-400">Q.</span> ここに載っているシリーズは全部U-NEXTで観られますか？
              <br />
              <span className="text-slate-500">
                A. Stage Connect に登録された配信リンクを元に整理しています。配信状況は変わるため、最終的には遷移先でご確認ください。
              </span>
            </li>
            <li>
              <span className="text-slate-400">Q.</span> “舞台→原作”で追う時、どこから入るのが楽？
              <br />
              <span className="text-slate-500">
                A. まず舞台の作品詳細へ → 原作が気になったらシリーズ一覧や検索で関連作へ、が最短です（迷子になりにくい）。
              </span>
            </li>
            <li>
              <span className="text-slate-400">Q.</span> 月額が高く感じます。
              <br />
              <span className="text-slate-500">
                A. ポイント付与の仕組みがあるため、使い方次第で体感が変わります。まずは無料トライアルの条件が合うか確認するのがおすすめです。
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WatchUNextPage;
