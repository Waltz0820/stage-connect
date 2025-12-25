import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";

type PlayRowRaw = {
  id: string;
  slug: string;
  title: string;
  year?: number | null;
  vod_links?: any;
  franchises?: { name?: string | null; slug?: string | null } | null;
};

type PlayItem = {
  id: string;
  slug: string;
  title: string;
  year?: number | null;
  franchiseName?: string | null;
  franchiseSlug?: string | null;
  vodUrl: string;
};

const PAGE_SIZE = 36;

type ProviderConfig = {
  providerParam: string;
  title: string;
  label: string;
  // vod_links の key が揺れても拾えるように複数候補
  vodKeys: string[];
  accentHoverClass: string;
  badgeClass: string;
};

const PROVIDERS: ProviderConfig[] = [
  {
    providerParam: "dmm",
    title: "DMMで観られる2.5次元作品",
    label: "DMM",
    vodKeys: ["dmm", "dmm_tv", "dmm-tv", "dmmTV"],
    accentHoverClass: "hover:bg-neon-pink/10",
    badgeClass: "bg-neon-pink/10 border-neon-pink/30 text-neon-pink",
  },
  {
    providerParam: "u-next",
    title: "U-NEXTで観られる2.5次元作品",
    label: "U-NEXT",
    vodKeys: ["unext", "u-next", "u_next", "uNext"],
    accentHoverClass: "hover:bg-neon-purple/10",
    badgeClass: "bg-neon-purple/10 border-neon-purple/30 text-neon-purple",
  },
  {
    providerParam: "danime",
    title: "dアニメストアで観られる2.5次元作品",
    label: "dアニメ",
    vodKeys: ["danime", "d-anime", "d_anime", "danime_store", "dアニメ", "dアニメストア"],
    accentHoverClass: "hover:bg-white/5",
    badgeClass: "bg-white/5 border-white/10 text-slate-200",
  },
];

function pickVodUrl(vodLinks: any, keys: string[]): string | null {
  if (!vodLinks) return null;

  // vod_links が object 形式想定
  if (typeof vodLinks === "object" && !Array.isArray(vodLinks)) {
    for (const k of keys) {
      const v = vodLinks?.[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  }

  // もし配列で入ってる場合（保険）
  if (Array.isArray(vodLinks)) {
    for (const item of vodLinks) {
      if (typeof item === "string") continue;
      for (const k of keys) {
        const v = item?.[k];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
    }
    return null;
  }

  return null;
}

const WatchProvider: React.FC = () => {
  const { provider } = useParams();
  const config = useMemo(() => PROVIDERS.find((p) => p.providerParam === provider), [provider]);

  const [items, setItems] = useState<PlayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const seqRef = useRef(0);

  // 不明providerは /watch に誘導（表示だけでもOK）
  const safeTitle = config?.title ?? "配信で観る | Stage Connect";
  const safeLabel = config?.label ?? "Watch";

  const breadcrumbs = useMemo(() => {
    return [
      { label: "配信で観る", to: "/watch" },
      { label: safeLabel, to: config ? `/watch/${config.providerParam}` : "/watch" },
    ];
  }, [config, safeLabel]);

  const fetchPage = async (nextPage: number) => {
    if (!config) return;

    const mySeq = ++seqRef.current;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // まずは "vod_links が null じゃない作品" を取って、フロントで provider のURLを抽出する（最短で動く）
    // 件数が増えたら、DB側に view / generated column で has_dmm 等を用意してサーバー側で絞るのが本命。
    const res = await supabase
      .from("plays")
      .select("id, slug, title, year, vod_links, franchises(name, slug)")
      .not("vod_links", "is", null)
      .order("title", { ascending: true })
      .range(from, to);

    if (mySeq !== seqRef.current) return;

    if (res.error) {
      console.warn("[watch] fetch error", res.error);
      // これ以上は止める
      setHasMore(false);
      return;
    }

    const raw: PlayRowRaw[] = (res.data as any) ?? [];
    const normalized: PlayItem[] = raw
      .map((r) => {
        const vodUrl = pickVodUrl(r.vod_links, config.vodKeys);
        if (!vodUrl) return null;
        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          year: r.year ?? null,
          franchiseName: r.franchises?.name ?? null,
          franchiseSlug: r.franchises?.slug ?? null,
          vodUrl,
        } as PlayItem;
      })
      .filter(Boolean) as PlayItem[];

    // 取得件数が PAGE_SIZE 未満なら、これ以上は無い可能性が高い
    // ただし provider 抽出で間引かれるので、厳密じゃない。まずはUX優先で「一定回数で止める」でもOK。
    const serverReturnedLess = raw.length < PAGE_SIZE;
    if (serverReturnedLess) setHasMore(false);

    if (nextPage === 0) setItems(normalized);
    else setItems((prev) => [...prev, ...normalized]);

    setPage(nextPage);
  };

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);

    if (!config) return;

    setLoading(true);
    fetchPage(0).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.providerParam]);

  const loadMore = async () => {
    if (!config) return;
    if (!hasMore) return;

    setLoadingMore(true);
    try {
      await fetchPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      {/* watch は index 前提 */}
      <SeoHead title={`${safeTitle} | Stage Connect`} robots="index,follow" />
      <Breadcrumbs items={breadcrumbs} />

      {/* 上：コンテンツ */}
      <div className="mb-8 text-center">
        <span
          className={`inline-block px-3 py-1 mb-4 rounded-full border text-xs font-bold tracking-widest uppercase ${config?.badgeClass ?? "bg-white/5 border-white/10 text-slate-300"}`}
        >
          {safeLabel}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{safeTitle}</h1>
        <p className="text-slate-400 text-sm">
          「今すぐ観られる」から入る棚。気分で作品を探す日に使ってください。
        </p>
      </div>

      <div className="bg-theater-surface/40 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
        <h2 className="text-white font-bold text-lg mb-2">この棚の使い方</h2>
        <ul className="text-slate-300 text-sm space-y-2">
          <li>・作品カードの「作品詳細」は Stage Connect 内。</li>
          <li>・「視聴する」は外部サイトへ遷移（別タブ推奨）。</li>
          <li className="text-slate-400">※配信状況は変わることがあります（登録リンクを元に整理しています）。</li>
        </ul>

        <div className="mt-5 flex flex-wrap gap-2 justify-center">
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
            to="/plays"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            作品一覧へ
          </Link>
        </div>
      </div>

      {/* 中：一覧 */}
      <div className="bg-theater-surface/30 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">LIST</div>
          <div className="text-[10px] text-slate-500">{loading ? "読み込み中..." : `${items.length} 件`}</div>
        </div>

        {loading && (
          <div className="p-10 text-center text-slate-500">読み込み中...</div>
        )}

        {!loading && items.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            まだこの棚に作品がありません（vod_links が未入力の可能性）。
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((it) => (
              <div
                key={it.id}
                className={`rounded-xl border border-white/10 bg-black/30 p-4 transition-colors ${config?.accentHoverClass ?? "hover:bg-white/5"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/plays/${it.slug}`}
                      className="block text-white font-semibold leading-snug hover:underline"
                    >
                      {it.title}
                    </Link>

                    <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-2 gap-y-1">
                      {it.franchiseName && (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-slate-600">シリーズ:</span>
                          <Link
                            to={`/series/${encodeURIComponent(it.franchiseSlug?.trim() ? it.franchiseSlug!.trim() : it.franchiseName!)}`}
                            className="text-slate-300 hover:underline"
                          >
                            {it.franchiseName}
                          </Link>
                        </span>
                      )}
                      {typeof it.year === "number" && (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-slate-600">年:</span>
                          <span className="text-slate-300">{it.year}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <a
                      href={it.vodUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[11px] font-bold hover:bg-white/10 transition-colors text-center"
                    >
                      視聴する ↗
                    </a>
                    <Link
                      to={`/plays/${it.slug}`}
                      className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-slate-200 text-[11px] font-bold hover:bg-white/10 transition-colors text-center"
                    >
                      作品詳細
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="p-4 border-t border-white/5 bg-black/20">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? "読み込み中..." : "もっと見る"}
            </button>
          </div>
        )}
      </div>

      {/* 下：コンテンツ */}
      <div className="mt-8 bg-theater-surface/30 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-white font-bold text-lg mb-2">次に迷ったら</h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          配信で入口を作ったら、次は「シリーズ」か「俳優」へ寄るのが一番気持ちいい。
          <br />
          StageConnectは内部リンクがガチガチなので、棚 → 作品 → 俳優 → 共演 → 別作品 の回遊が勝ち筋。
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/actors"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            俳優一覧へ
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
        </div>
      </div>
    </div>
  );
};

export default WatchProvider;
