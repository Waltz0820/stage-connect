// src/components/watch/WatchDmmPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Breadcrumbs from "../Breadcrumbs";
import SeoHead from "../SeoHead";

type FranchiseRow = { name?: string | null; slug?: string | null } | null;

type PlayRowRaw = {
  id: string;
  slug: string;
  title: string;
  // ✅ year は DB に無いので取らない（必要なら後で正しい列名に差し替え）
  vod?: any; // JSON
  vod_links?: any; // 旧名の保険
  franchises?: FranchiseRow;
};

type PlayItem = {
  id: string;
  slug: string;
  title: string;
  franchiseName?: string | null;
  franchiseSlug?: string | null;
  vodUrl: string;
};

const PAGE_SIZE = 36;

// vod の key 揺れ吸収
const DMM_KEYS = ["dmm", "dmm_tv", "dmm-tv", "dmmTV", "dmm tv", "DMM", "DMMTV", "dmmTV_url"];

function pickVodUrl(vodJson: any, keys: string[]): string | null {
  if (!vodJson) return null;

  // object想定
  if (typeof vodJson === "object" && !Array.isArray(vodJson)) {
    for (const k of keys) {
      const v = vodJson?.[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  }

  // 配列で来た場合の保険
  if (Array.isArray(vodJson)) {
    for (const item of vodJson) {
      if (!item || typeof item !== "object") continue;
      for (const k of keys) {
        const v = item?.[k];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
    }
  }

  return null;
}

const WatchDmmPage: React.FC = () => {
  const [items, setItems] = useState<PlayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const seqRef = useRef(0);

  const breadcrumbs = useMemo(
    () => [
      { label: "配信で観る", to: "/watch" },
      { label: "DMM", to: "/watch/dmm" },
    ],
    []
  );

  const TITLE = "DMMで観られる2.5次元作品";
  const BADGE_CLASS = "bg-neon-pink/10 border-neon-pink/30 text-neon-pink";
  const HOVER_CLASS = "hover:bg-neon-pink/10";

  // 審査前などの「仮の着地点」
  const DMM_FALLBACK_URL = "https://www.dmm.com/";

  const normalize = (r: PlayRowRaw, vodUrl: string): PlayItem => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    franchiseName: r.franchises?.name ?? null,
    franchiseSlug: r.franchises?.slug ?? null,
    vodUrl,
  });

  const fetchPage = async (nextPage: number) => {
    const mySeq = ++seqRef.current;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // ✅ DBに確実にある列だけで取る（year を取らない）
    // ✅ vod が本命。念のため vod_links も一緒に取っておく（どっちでも拾えるように）
    const res = await supabase
      .from("plays")
      .select("id, slug, title, vod, vod_links, franchises(name, slug)")
      .not("vod", "is", null) // PlayCardが動いてるならまずこれが正
      .order("title", { ascending: true })
      .range(from, to);

    if (mySeq !== seqRef.current) return;

    // vod列が無い環境に備えてフォールバック（万一）
    if (res.error) {
      console.warn("[watch/dmm] fetch error (vod)", res.error);

      // ここだけ保険：vod が無い/権限NG等なら vod_links で再試行
      const res2 = await supabase
        .from("plays")
        .select("id, slug, title, vod_links, franchises(name, slug)")
        .not("vod_links", "is", null)
        .order("title", { ascending: true })
        .range(from, to);

      if (mySeq !== seqRef.current) return;

      if (res2.error) {
        console.warn("[watch/dmm] fetch error (vod_links)", res2.error);
        setHasMore(false);
        return;
      }

      const raw2: PlayRowRaw[] = (res2.data as any) ?? [];
      const normalized2: PlayItem[] = raw2
        .map((r) => {
          const url = pickVodUrl(r.vod_links, DMM_KEYS);
          if (!url) return null;
          return normalize(r, url);
        })
        .filter(Boolean) as PlayItem[];

      if (raw2.length < PAGE_SIZE) setHasMore(false);
      if (nextPage === 0) setItems(normalized2);
      else setItems((prev) => [...prev, ...normalized2]);
      setPage(nextPage);
      return;
    }

    const raw: PlayRowRaw[] = (res.data as any) ?? [];
    const normalized: PlayItem[] = raw
      .map((r) => {
        // vod が本命、無ければ vod_links も見る
        const url = pickVodUrl(r.vod ?? r.vod_links, DMM_KEYS);
        if (!url) return null;
        return normalize(r, url);
      })
      .filter(Boolean) as PlayItem[];

    if (raw.length < PAGE_SIZE) setHasMore(false);
    if (nextPage === 0) setItems(normalized);
    else setItems((prev) => [...prev, ...normalized]);

    setPage(nextPage);
  };

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);

    setLoading(true);
    fetchPage(0).finally(() => setLoading(false));
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

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title={`${TITLE} | Stage Connect`} robots="index,follow" />
      <Breadcrumbs items={breadcrumbs} />

      {/* 上：コンテンツ */}
      <div className="mb-8 text-center">
        <span
          className={`inline-block px-3 py-1 mb-4 rounded-full border text-xs font-bold tracking-widest uppercase ${BADGE_CLASS}`}
        >
          DMM
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{TITLE}</h1>
        <p className="text-slate-400 text-sm">
          「配信で今すぐ観たい」日用の棚。作品 → 俳優 → 共演 → 次の作品、で深掘りしていけます。
        </p>
      </div>

      <div className="bg-theater-surface/40 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
        <h2 className="text-white font-bold text-lg mb-2">この棚の使い方</h2>
        <ul className="text-slate-300 text-sm space-y-2">
          <li>・「作品詳細」は Stage Connect 内（キャスト・シリーズ・年表へ繋がります）。</li>
          <li>・「視聴する」は外部へ（別タブ推奨）。</li>
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

        {loading && <div className="p-10 text-center text-slate-500">読み込み中...</div>}

        {!loading && items.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            まだこの棚に作品がありません（vod のDMMリンクが未入力の可能性）。
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((it) => {
              const seriesKey = it.franchiseSlug?.trim()
                ? it.franchiseSlug.trim()
                : it.franchiseName ?? null;

              const vodHref = it.vodUrl?.trim() ? it.vodUrl.trim() : DMM_FALLBACK_URL;

              return (
                <div
                  key={it.id}
                  className={`rounded-xl border border-white/10 bg-black/30 p-4 transition-colors ${HOVER_CLASS}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/plays/${it.slug}`} className="block text-white font-semibold leading-snug hover:underline">
                        {it.title}
                      </Link>

                      <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-2 gap-y-1">
                        {it.franchiseName && seriesKey && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-600">シリーズ:</span>
                            <Link to={`/series/${encodeURIComponent(seriesKey)}`} className="text-slate-300 hover:underline">
                              {it.franchiseName}
                            </Link>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <a
                        href={vodHref}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
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
              );
            })}
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
        <h2 className="text-white font-bold text-lg mb-2">DMM棚の補足</h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          DMMで配信されている作品は、作品単位で追うより「シリーズ」で追うと体験が綺麗です。
          <br />
          迷ったら、まずはシリーズ → 作品 → 俳優 の順で深掘りするのがおすすめ。
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/series"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            シリーズ一覧へ
          </Link>
          <Link
            to="/actors"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            俳優一覧へ
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

export default WatchDmmPage;
