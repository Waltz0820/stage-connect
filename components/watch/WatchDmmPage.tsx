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

const PAGE_SIZE = 12;

const WatchDmmPage: React.FC = () => {
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
      { label: "DMM TV" },
    ],
    []
  );

  const BADGE_CLASS = "bg-neon-pink/10 border-neon-pink/30 text-neon-pink";
  const CARD_HOVER =
    "hover:border-neon-pink/40 hover:shadow-[0_0_20px_rgba(233,68,166,0.15)]";
  const INPUT_FOCUS =
    "focus:border-neon-pink/40 focus:ring-2 focus:ring-neon-pink/20";

  const DMM_FALLBACK_URL = "https://tv.dmm.com/vod/genre/?genre=stage";
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
  const SEO_TITLE = `2.5次元の配信が強い。DMM TVで見られるシリーズまとめ【現在${countLabel}シリーズ】`;

  return (
    <div className="container mx-auto px-6 pt-8 pb-32 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title={`${SEO_TITLE} | Stage Connect`} robots="index,follow" />
      <Breadcrumbs items={breadcrumbs} />

      {/* --- HEADER SECTION --- */}
      <div className="mb-12 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-pink/10 blur-[120px] pointer-events-none" />
        <span
          className={`relative inline-block px-4 py-1.5 mb-6 rounded-full border text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-sm ${BADGE_CLASS}`}
        >
          DMM TV Media Mix Archive
        </span>
        <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter italic uppercase">
          Watch on <span className="text-neon-pink">DMM TV</span>
        </h1>
        <p className="relative max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed font-light">
          DMM TVで視聴できる2.5次元舞台・ミュージカルを、
          <span className="text-slate-200 font-semibold">シリーズ単位</span>
          で整理しました。
          <br />
          「次に観る一本」に最短で辿り着くための、回遊入口です。
        </p>
      </div>

      {/* --- TOP SEO CONTENT BLOCK --- */}
      <div className="bg-theater-surface/60 border border-white/5 rounded-2xl p-8 mb-12 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 blur-3xl pointer-events-none" />
        <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-pink" />
          2.5次元の配信先で迷ったら、まずDMM TV
        </h2>

        <div className="text-slate-300 text-sm space-y-5 leading-relaxed font-light">
          <p>
            「2.5次元 配信 どこ」「舞台 配信 見放題」「ミュージカル 映像 サブスク」。
            <br />
            こういう探し方をしている人は、まず{" "}
            <span className="text-slate-100 font-bold border-b border-neon-pink/50">
              DMM TV
            </span>{" "}
            をチェックしておくと効率が良いです。
          </p>

          <p>
            このページは、Stage Connectに登録された配信リンク（DMM TV）を元に、
            <span className="text-slate-100 font-bold">シリーズごと</span>に集約して一覧化しています。
            「気になっていたシリーズ」や「推しの出演作」から入って、作品詳細→俳優→共演へと芋づる式に回遊できます。
          </p>

          <p className="text-xs text-slate-500 italic">
            ※配信状況・料金・無料体験の条件は変更される場合があります。最終確認は遷移先の公式ページをご確認ください。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {[
            "2.5次元 配信 どこ",
            "舞台 配信 見放題",
            "ミュージカル 配信 一覧",
            "2.5次元 アーカイブ",
            "推し 出演作 配信",
          ].map((chip) => (
            <span
              key={chip}
              className="text-[10px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 font-mono tracking-wider"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "シリーズから入る",
              desc: "タイトルが多いほど、シリーズ単位の方が迷いにくい。当たりを付けるのが最短です。",
            },
            {
              step: "02",
              title: "作品詳細で深掘る",
              desc: "キャスト・共演・年表へ。配信だけで終わらず「次に観る」が見つかる設計です。",
            },
            {
              step: "03",
              title: "名前が曖昧なら検索",
              desc: "うろ覚えでもOK。検索からシリーズに寄ると回遊スピードが上がります。",
            },
          ].map((how) => (
            <div key={how.step} className="group">
              <div className="text-[10px] font-black text-neon-pink mb-1 tracking-widest uppercase">
                Step {how.step}
              </div>
              <div className="text-white font-bold text-sm mb-2 group-hover:text-neon-pink transition-colors">
                {how.title}
              </div>
              <div className="text-slate-400 text-xs leading-relaxed font-light">
                {how.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- DATA LIST SECTION --- */}
      <div className="bg-theater-surface/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm mb-12">
        <div className="px-8 py-5 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse" />
            <div className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              Series Library
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {loading ? "FETCHING..." : `${countLabel} FRANCHISES`}
          </div>
        </div>

        <div className="px-8 py-6 border-b border-white/5 bg-black/10">
          <div className="relative group">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="シリーズ名で絞り込み（例：刀剣乱舞 / テニミュ）"
              className={`w-full rounded-xl bg-black/30 border border-white/10 px-6 py-4 text-sm text-white placeholder:text-slate-600 outline-none transition duration-300 ${INPUT_FOCUS}`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-neon-pink transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-2 italic">
            ※DMM TVの配信リンクが登録されている作品を含むシリーズを表示しています。
          </div>
        </div>

        {loading && (
          <div className="p-32 text-center text-slate-600 font-mono text-xs tracking-[0.3em] animate-pulse">
            ACCESSING DATABASE...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-16 text-center text-slate-500 text-sm">
            該当するシリーズが見つかりませんでした。別のキーワードでお試しください。
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((it) => {
              const seriesHref = `/series/${encodeURIComponent(it.key)}`;
              return (
                <div
                  key={it.id}
                  className={`group relative rounded-xl border border-white/5 bg-black/30 p-6 transition-all duration-300 ${CARD_HOVER}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        to={seriesHref}
                        className="block text-white font-bold text-lg group-hover:text-neon-pink transition-colors truncate mb-1"
                      >
                        {it.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span className="text-neon-pink/60">COLLECTION:</span>
                        <span>{it.playsCount} PLAYS</span>
                      </div>
                    </div>
                    <Link
                      to={seriesHref}
                      className="shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:bg-neon-pink/20 group-hover:text-neon-pink group-hover:border-neon-pink/30 transition-all"
                      aria-label="シリーズ詳細へ"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && !loading && (
          <div className="p-8 border-t border-white/5 bg-black/20 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-12 py-3 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-black tracking-[0.2em] hover:bg-white/10 hover:border-white/30 transition-all disabled:opacity-50 uppercase"
            >
              {loadingMore ? "LOADING..." : "Discover More Series"}
            </button>
          </div>
        )}
      </div>

      {/* --- BOTTOM SEO / CV SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-12">
          <section>
            <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-neon-pink rounded-full shadow-[0_0_10px_#E944A6]" />
              まず試しやすい価格帯。視聴環境も作りやすい
            </h2>
            <div className="text-slate-400 text-sm leading-loose font-light space-y-4">
              <p>
                DMM TVは月額料金が比較的始めやすい価格帯で、2.5次元の配信を「まず体験してみる」入口として選びやすいのが特徴です。
                週末にまとめて観る、遠征の移動時間に消化するなど、サブスクの使い方と非常に相性が良いサービスです。
              </p>
              <p>
                作品詳細から「お気に入り」に入れて後でじっくり観るなど、ファン活動のインフラとしても重宝します。
                このページを起点に、シリーズ→作品→キャストへ回遊して、次の一本を拾っていってください。
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={DMM_FALLBACK_URL}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="px-6 py-2.5 rounded-full bg-neon-pink/20 border border-neon-pink/40 text-white text-xs font-bold hover:bg-neon-pink/40 transition-all"
              >
                DMM TVを開く ↗
              </a>
              <Link
                to="/series"
                className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
              >
                シリーズ一覧へ
              </Link>
            </div>
          </section>

          <section className="bg-theater-surface/30 border border-white/5 rounded-2xl p-8">
            <h2 className="text-white font-bold text-lg mb-8 tracking-widest uppercase italic opacity-80">
              Media Mix FAQ
            </h2>
            <ul className="space-y-8">
              {[
                {
                  q: "ここに載っているシリーズは、必ずDMM TVで観られますか？",
                  a: "Stage Connectに登録された配信リンクを元に整理しています。配信状況は日々変動するため、最終的には遷移先のDMM TV公式ページでご確認ください。",
                },
                {
                  q: "シリーズ一覧に無い作品はどうすればいい？",
                  a: "配信リンクが未登録、または配信が終了している可能性があります。サイト上部の検索から作品名で直接探してみるのもおすすめです。",
                },
                {
                  q: "作品一覧ではなくシリーズ一覧なのはなぜ？",
                  a: "2.5次元舞台はシリーズ単位で繋がりやすく、シリーズを起点にした方が「次に何を観ればいいか」を迷わず見つけられるからです。",
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
          </section>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-theater-surface/50 border border-white/5 rounded-2xl p-8 sticky top-24 backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-6">
              Archive Stats
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="text-[10px] text-slate-500 mb-1">DMM SERIES</div>
                <div className="text-2xl font-black text-white">{countLabel}</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="text-[10px] text-slate-500 mb-1">LAST SYNC</div>
                <div className="text-sm font-mono text-neon-pink">{UPDATED}</div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/search"
                className="flex items-center justify-between w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-neon-pink/10 hover:border-neon-pink/30 transition-all group"
              >
                作品名・俳優名で検索
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
                to="/watch"
                className="flex items-center justify-between w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all group"
              >
                配信ガイドTOP
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
        ※Stage Connect Media Database | Optimized for Cross-Media Discovery
        <br />
        SYNC ID: DMM-ARCHIVE-V2
      </p>
    </div>
  );
};

export default WatchDmmPage;
