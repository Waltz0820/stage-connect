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

const WatchUnextPage: React.FC = () => {
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
      { label: "U-NEXT" },
    ],
    []
  );

  const BADGE_CLASS = "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan";
  const CARD_HOVER =
    "hover:border-neon-cyan/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)]";
  const INPUT_FOCUS =
    "focus:border-neon-cyan/40 focus:ring-2 focus:ring-neon-cyan/20";

  const UNEXT_FALLBACK_URL = "https://video.unext.jp/browse/genre/MNU0000140";
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
    if (res.error) return;
    if (typeof res.count === "number") setTotalCount(res.count);
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
  const SEO_TITLE = `原作アニメも舞台版もまとめて楽しむなら。U-NEXTで見られる2.5次元シリーズまとめ【現在${countLabel}シリーズ】`;

  return (
    <div className="container mx-auto px-6 pt-8 pb-32 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title={`${SEO_TITLE} | Stage Connect`} robots="index,follow" />
      <Breadcrumbs items={breadcrumbs} />

      {/* --- HEADER SECTION --- */}
      <div className="mb-12 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-cyan/10 blur-[120px] pointer-events-none" />
        <span
          className={`relative inline-block px-4 py-1.5 mb-6 rounded-full border text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-sm ${BADGE_CLASS}`}
        >
          U-NEXT Media Mix Archive
        </span>
        <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter italic uppercase">
          Watch on <span className="text-neon-cyan">U-NEXT</span>
        </h1>
        <p className="relative max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed font-light">
          U-NEXTで視聴できる2.5次元舞台を、
          <span className="text-slate-200 font-semibold">シリーズ単位</span>
          で整理しました。
          <br />
          舞台から原作アニメ、映画、関連映像まで、作品世界をまるごと回遊するための入口です。
        </p>
      </div>

      {/* --- TOP SEO CONTENT BLOCK --- */}
      <div className="bg-theater-surface/60 border border-white/5 rounded-2xl p-8 mb-12 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl pointer-events-none" />
        <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
          U-NEXTが刺さるのは「世界観をまとめて追う人」
        </h2>
        <div className="text-slate-300 text-sm space-y-5 leading-relaxed font-light">
          <p>
            「舞台を観てから原作アニメを履修したい」「原作ファンとして舞台版も見たい」。
            <br />
            そんな
            <span className="text-slate-100 font-bold border-b border-neon-cyan/50">
              “作品世界をまとめて追いかけたい人”
            </span>
            に向いているのがU-NEXTです。
          </p>
          <p>
            同じシリーズでも、舞台だけ追うか、アニメ・映画・関連映像まで追うかで“満足度の伸び方”が変わります。U-NEXTは映像ラインが強いタイトルが多く、
            <span className="text-slate-100 font-bold">「探す」「移動する」手間が減る</span>
            のが大きな強みです。
          </p>
          <p className="text-xs text-slate-500 italic">
            ※Stage Connectに登録された配信リンク（U-NEXT）を元に集約しています。最新の配信状況は遷移先でご確認ください。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {[
            "2.5次元 配信 U-NEXT",
            "舞台 アニメ まとめて",
            "原作 履修 順番",
            "シリーズ 一気見",
            "メディアミックス 配信",
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
              title: "シリーズで当たりを付ける",
              desc: "まずシリーズ一覧で探す。舞台だけでなく、関連映像まで“追う前提”の人ほど効きます。",
            },
            {
              step: "02",
              title: "作品詳細からキャストへ",
              desc: "推しの出演作→共演の流れで回遊。データベースを跨ぐことで“視聴計画”が立ちます。",
            },
            {
              step: "03",
              title: "うろ覚えなら検索",
              desc: "タイトルが曖昧でもOK。検索からシリーズに寄るのが作品世界への最短ルートです。",
            },
          ].map((how) => (
            <div key={how.step} className="group">
              <div className="text-[10px] font-black text-neon-cyan mb-1 tracking-widest uppercase">
                Step {how.step}
              </div>
              <div className="text-white font-bold text-sm mb-2 group-hover:text-neon-cyan transition-colors">
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
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <div className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              Series Library
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {loading ? "SEARCHING..." : `${countLabel} FRANCHISES`}
          </div>
        </div>

        <div className="px-8 py-6 border-b border-white/5 bg-black/10">
          <div className="relative group">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="シリーズ名で絞り込み（例：ヒプステ / テニミュ）"
              className={`w-full rounded-xl bg-black/30 border border-white/10 px-6 py-4 text-sm text-white placeholder:text-slate-600 outline-none transition duration-300 ${INPUT_FOCUS}`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-neon-cyan transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-2 italic">
            ※U-NEXTの配信リンクが登録されている作品を含むシリーズを表示しています。
          </div>
        </div>

        {loading && (
          <div className="p-32 text-center text-slate-600 font-mono text-xs tracking-[0.3em] animate-pulse">
            CONNECTING TO CATALOG...
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
                        className="block text-white font-bold text-lg group-hover:text-neon-cyan transition-colors truncate mb-1"
                      >
                        {it.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span className="text-neon-cyan/60">COLLECTION:</span>
                        <span>{it.playsCount} PLAYS</span>
                      </div>
                    </div>
                    <Link
                      to={seriesHref}
                      className="shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:bg-neon-cyan/20 group-hover:text-neon-cyan group-hover:border-neon-cyan/30 transition-all"
                      aria-label="シリーズ詳細へ"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
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
              <span className="w-1 h-6 bg-neon-cyan rounded-full shadow-[0_0_10px_#00FFFF]" />
              “月額が高い”を、ポイント込みで考える
            </h2>
            <div className="text-slate-400 text-sm leading-loose font-light space-y-4">
              <p>
                U-NEXTは月額料金が他サービスより高めに見えますが、月額プランにはポイントが付与される仕組みがあります。このポイントを使う前提であれば、舞台のレンタル作品や原作コミックの購入に充てることができ、体感の負担は大きく変わります。
              </p>
              <p>
                舞台だけでなく映画・アニメ・関連映像も高画質で楽しみたい人にとって、これらを「一つの窓口でまとめて管理できる」メリットは計り知れません。まずは無料トライアルで、自分の推し作品がどこまで網羅されているかチェックするのが最短の正解です。
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={UNEXT_FALLBACK_URL}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="px-6 py-2.5 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 text-white text-xs font-bold hover:bg-neon-cyan/40 transition-all"
              >
                U-NEXTを開く ↗
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
                  q: "ここに載っているシリーズは全部U-NEXTで観られますか？",
                  a: "Stage Connectに登録された配信リンクを元に整理しています。配信状況は日々変動するため、最終的には遷移先のU-NEXT公式ページでご確認ください。",
                },
                {
                  q: "“舞台→原作”で追う時、どこから入るのが楽？",
                  a: "まず舞台の作品詳細ページへ。そこから原作が気になったら、シリーズ一覧や検索を使い、U-NEXT内で関連作を芋づる式に探すのが最も迷いにくいルートです。",
                },
                {
                  q: "高画質で視聴したいのですが...",
                  a: "U-NEXTは他サービスと比較しても配信ビットレートが高く、舞台の細かな表情や殺陣のスピード感を楽しみたい方に特におすすめの視聴環境です。",
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

        <div className="lg:col-span-5">
          <div className="bg-theater-surface/50 border border-white/5 rounded-2xl p-8 sticky top-24 backdrop-blur-md">
            <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-6">
              Archive Stats
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="text-[10px] text-slate-500 mb-1">UNEXT SERIES</div>
                <div className="text-2xl font-black text-white">{countLabel}</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="text-[10px] text-slate-500 mb-1">LAST SYNC</div>
                <div className="text-sm font-mono text-neon-cyan">{UPDATED}</div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/search"
                className="flex items-center justify-between w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all group"
              >
                作品名・原作名で検索
                <svg
                  className="w-4 h-4 text-slate-600 group-hover:text-neon-cyan transition-colors"
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
        SYNC ID: UNEXT-ARCHIVE-V2
      </p>
    </div>
  );
};

export default WatchUnextPage;
