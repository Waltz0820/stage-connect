import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";
import { useOgImage, useSiteUrl } from "../../lib/hooks/useSiteUrl";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

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
  const siteUrl = useSiteUrl();
  const ogImage = useOgImage();
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

  const SEO_TITLE = "DMM TVで観られる2.5次元舞台｜シリーズ一覧・配信ガイド";
  const SEO_DESC =
    `2.5次元舞台・ミュージカルをDMM TV（DMMプレミアム）で観るためのガイド。現在${countLabel}シリーズが配信中。刀剣乱舞・ヒプステ・テニミュなど人気作品を網羅。14日間無料トライアルあり。`;

  const canonical = useMemo(() => (siteUrl ? `${siteUrl}/watch/dmm` : ""), [siteUrl]);

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "DMM TVで2.5次元舞台は何シリーズ観られますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: `現在、Stage Connectに登録されているDMM TV配信作品は${countLabel}シリーズです。刀剣乱舞、ヒプノシスマイク、テニスの王子様など主要な2.5次元舞台を網羅しています。`,
        },
      },
      {
        "@type": "Question",
        name: "DMMプレミアムの料金と無料期間は？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DMMプレミアムは月額550円（税込）で、初回登録時は14日間の無料トライアルがあります。期間中は見放題対象の2.5次元舞台を追加料金なしで視聴できます。",
        },
      },
      {
        "@type": "Question",
        name: "ここに載っているシリーズは必ずDMM TVで観られますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Stage Connectに登録された配信リンクを元に整理しています。配信状況は変動するため、最終的には遷移先のDMM TV公式ページでご確認ください。見放題対象かレンタルかは作品によって異なります。",
        },
      },
      {
        "@type": "Question",
        name: "シリーズ一覧にない作品を探すには？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "配信リンクが未登録、または配信が終了している可能性があります。検索機能から作品名やキャスト名で直接探すか、シリーズ一覧から関連作品を辿ってみてください。",
        },
      },
    ],
  };

  return (
    <div className="container mx-auto px-6 pt-8 pb-32 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead
        title={`${SEO_TITLE} | Stage Connect`}
        description={SEO_DESC}
        canonical={canonical}
        robots="index,follow"
        metas={[
          { property: "og:locale", content: "ja_JP" },
          { property: "og:type", content: "article" },
          { property: "og:site_name", content: "Stage Connect" },
          { property: "og:title", content: `${SEO_TITLE} | Stage Connect` },
          { property: "og:description", content: SEO_DESC },
          ...(canonical ? [{ property: "og:url", content: canonical }] : []),
          ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
          { name: "twitter:card", content: ogImage ? "summary_large_image" : "summary" },
          { name: "twitter:title", content: `${SEO_TITLE} | Stage Connect` },
          { name: "twitter:description", content: SEO_DESC },
          ...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
        ]}
        jsonLd={jsonLdFaq}
      />
      <Breadcrumbs items={breadcrumbs} />

      {/* --- HERO --- */}
      <div className="mb-16 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-pink/15 blur-[120px] pointer-events-none" />
        <span
          className={`relative inline-block px-4 py-1.5 mb-6 rounded-full border text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-sm ${BADGE_CLASS}`}
        >
          DMM Premium × Stage Connect
        </span>
        <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">
          2.5次元舞台を
          <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-purple"> DMM TVで観る</span>
        </h1>
        <p className="relative max-w-2xl mx-auto text-slate-400 text-sm leading-relaxed font-light">
          DMM TV（DMMプレミアム）で視聴できる2.5次元舞台・ミュージカルを、
          <span className="text-slate-200 font-semibold">シリーズ単位</span>
          で整理しました。
          <br />
          刀剣乱舞・ヒプステ・テニミュなど、人気シリーズを網羅。
        </p>
      </div>

      {/* --- DMMプレミアム CTA HERO --- */}
      <div className="mb-12 relative">
        <div className="bg-theater-surface/60 border border-neon-pink/20 rounded-2xl p-10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-neon-pink/10 blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black tracking-[0.3em] text-neon-pink uppercase">
                DMMプレミアム
              </span>
              <span className="px-2 py-0.5 rounded-full bg-neon-pink/20 border border-neon-pink/30 text-[9px] font-black text-neon-pink">
                2.5次元 国内最充実
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed font-light max-w-xl mb-6">
              2.5次元舞台の見放題ラインナップが国内最大級。
              月額550円（税込）、<span className="text-neon-pink font-bold">14日間の無料トライアル</span>で
              まずは配信タイトルを確認してみてください。
            </p>
            <div className="flex flex-wrap gap-4 items-center mb-8">
              <a
                href={DMM_PREMIUM_URL}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="px-8 py-4 rounded-xl bg-neon-pink/20 border border-neon-pink/40 text-white text-sm font-bold hover:bg-neon-pink/30 hover:shadow-[0_0_24px_rgba(233,68,166,0.3)] transition-all"
              >
                14日間無料で始める
              </a>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "月額", value: "550円", note: "(税込)" },
                { label: "無料トライアル", value: "14日間", note: "" },
                { label: "配信シリーズ", value: countLabel, note: "本サイト集計" },
              ].map((stat) => (
                <div key={stat.label} className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] text-slate-500 mb-1">{stat.label}</div>
                  <div className="text-white font-bold text-lg">
                    {stat.value}
                    {stat.note && <span className="text-slate-500 text-xs font-light ml-1">{stat.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- SEO CONTENT --- */}
      <div className="bg-theater-surface/60 border border-white/5 rounded-2xl p-8 mb-12 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 blur-3xl pointer-events-none" />
        <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-pink" />
          なぜDMM TVが2.5次元に強いのか
        </h2>

        <div className="text-slate-300 text-sm space-y-5 leading-relaxed font-light">
          <p>
            2.5次元舞台・ミュージカルの配信サービスは複数ありますが、
            <span className="text-slate-100 font-bold border-b border-neon-pink/50">見放題で観られるラインナップの充実度ではDMM TVが圧倒的</span>
            です。
          </p>

          <p>
            刀剣乱舞、ヒプノシスマイク、テニスの王子様、あんさんぶるスターズ、
            ハイキュー!!、弱虫ペダルなど、2.5次元ファンが押さえたい主要シリーズの多くがDMM TVで配信されています。
            他のサービスでは都度課金やレンタルでしか観られない作品も、
            DMMプレミアムなら見放題対象に含まれていることが多いのが大きな強みです。
          </p>

          <p>
            「2.5次元 配信 どこ」「舞台 配信 見放題」「ミュージカル 映像 サブスク」——
            こういう探し方をしている方にとって、
            <span className="text-slate-100 font-bold">まず確認すべきサービスがDMM TV</span>
            です。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {[
            "2.5次元 配信 どこ",
            "舞台 配信 見放題",
            "ミュージカル 配信 一覧",
            "DMM TV 2.5次元",
            "DMMプレミアム 舞台",
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

      {/* --- BOTTOM SEO / CTA SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-12">
          <section>
            <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-neon-pink rounded-full shadow-[0_0_10px_#E944A6]" />
              このページの使い方
            </h2>
            <div className="text-slate-400 text-sm leading-loose font-light space-y-4">
              <p>
                上のシリーズ一覧から気になる作品を見つけたら、シリーズ詳細ページへ進んでください。
                シリーズ→作品詳細→キャスト→共演ネットワークと、
                芋づる式に「次に観る作品」が見つかる設計になっています。
              </p>
              <p>
                配信作品は順次追加されていきます。「まだ載っていない」作品があれば、
                今後の更新で追加される可能性がありますので、定期的にチェックしてみてください。
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: "01",
                  title: "シリーズから入る",
                  desc: "シリーズ単位で把握すると履修順が見えてくる。",
                },
                {
                  step: "02",
                  title: "作品詳細で深掘る",
                  desc: "キャスト・共演・年表で次の一本を見つける。",
                },
                {
                  step: "03",
                  title: "名前で検索",
                  desc: "うろ覚えでもOK。検索→シリーズで回遊開始。",
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
          </section>

          <section className="bg-theater-surface/30 border border-white/5 rounded-2xl p-8">
            <h2 className="text-white font-bold text-lg mb-8 tracking-widest uppercase italic opacity-80">
              FAQ
            </h2>
            <ul className="space-y-8">
              {[
                {
                  q: "DMM TVで2.5次元舞台は何シリーズ観られますか？",
                  a: `現在、Stage Connectに登録されているDMM TV配信作品は${countLabel}シリーズです。刀剣乱舞、ヒプノシスマイク、テニスの王子様など主要な2.5次元舞台を網羅しています。`,
                },
                {
                  q: "DMMプレミアムの料金と無料期間は？",
                  a: "DMMプレミアムは月額550円（税込）で、初回登録時は14日間の無料トライアルがあります。期間中は見放題対象の2.5次元舞台を追加料金なしで視聴できます。",
                },
                {
                  q: "ここに載っているシリーズは必ずDMM TVで観られますか？",
                  a: "Stage Connectに登録された配信リンクを元に整理しています。配信状況は変動するため、最終的には遷移先のDMM TV公式ページでご確認ください。見放題対象かレンタルかは作品によって異なります。",
                },
                {
                  q: "シリーズ一覧にない作品を探すには？",
                  a: "配信リンクが未登録、または配信が終了している可能性があります。検索機能から作品名やキャスト名で直接探すか、シリーズ一覧から関連作品を辿ってみてください。",
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

        {/* --- SIDEBAR --- */}
        <div className="lg:col-span-5">
          <div className="bg-theater-surface/50 border border-white/5 rounded-2xl p-8 sticky top-24 backdrop-blur-md space-y-8">
            {/* DMMプレミアム CTA */}
            <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-xl p-6">
              <div className="text-[10px] font-black tracking-[0.3em] text-neon-pink uppercase mb-3">
                DMMプレミアム
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-light mb-4">
                2.5次元舞台の見放題が国内最充実。まずは14日間の無料トライアルで配信タイトルを確認。
              </p>
              <a
                href={DMM_PREMIUM_URL}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="block text-center px-6 py-3 rounded-lg bg-neon-pink/20 border border-neon-pink/40 text-white text-xs font-bold hover:bg-neon-pink/30 hover:shadow-[0_0_16px_rgba(233,68,166,0.3)] transition-all"
              >
                14日間無料で始める
              </a>
            </div>

            {/* Archive Stats */}
            <div>
              <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-4">
                Archive Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] text-slate-500 mb-1">DMM SERIES</div>
                  <div className="text-2xl font-black text-white">{countLabel}</div>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] text-slate-500 mb-1">PRICE</div>
                  <div className="text-sm font-mono text-neon-pink">¥550/月</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
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

      {/* --- Disclaimer --- */}
      <p className="mt-20 text-[10px] text-slate-700 text-center font-light leading-loose tracking-widest">
        ※Stage Connect に登録された視聴リンクを元に整理しています。
        <br />
        ※配信状況は変わることがあります。最新情報は遷移先の配信ページをご確認ください。
      </p>
    </div>
  );
};

export default WatchDmmPage;
