// src/components/SeriesList.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';
import SeoHead from './SeoHead';
import { supabase } from '../lib/supabase';
import type { Actor, Gender } from '../lib/types';

const SITE_NAME = 'Stage Connect';

type FranchiseMetaRow = {
  id: string;
  name: string;
  slug?: string | null;
  origin_type?: string | null;
  origin_note?: string | null;
  production_companies?: string[] | null;
};

type FranchiseStats = {
  name: string;
  playCount: number;
  years: { start: number; end: number };
  topActors: { actor: Actor; count: number }[];
};

type FranchiseUI = FranchiseMetaRow & FranchiseStats;

type SortKey = 'play_count_desc' | 'name_asc';

const normalizeActorRow = (row: any): Actor => ({
  slug: row.slug,
  name: row.name,
  kana: row.kana ?? '',
  profile: row.profile ?? '',
  imageUrl: row.image_url ?? row.imageUrl ?? '',
  gender: (row.gender ?? 'male') as Gender,
  sns: (row.sns as Actor['sns']) ?? {},
  featuredPlaySlugs: (row.featured_play_slugs as string[] | undefined) ?? [],
  tags: (row.tags as string[] | undefined) ?? [],
});

const toPlainText = (s: any) => {
  const str = String(s ?? '');
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
};

const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, Math.max(0, n - 1)) + '…');

const normalizeOrigin = (s: any) => String(s ?? '').trim();

const yearFromPeriod = (period?: string | null) => {
  if (!period) return 0;
  const m = String(period).match(/(\d{4})/);
  return m ? Number(m[1]) : 0;
};

const getSeriesKey = (f: FranchiseUI) => {
  const slug = f.slug?.trim();
  if (slug) return slug;
  return f.name; // fallback
};

const SeriesList: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // ✅ UI state
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('play_count_desc');

  // ✅ Pagination (Plays.tsx と同じ思想)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // ✅ DB data
  const [franchisesDb, setFranchisesDb] = useState<FranchiseMetaRow[]>([]);
  const [playsDb, setPlaysDb] = useState<{ id: string; franchise_id: string | null; period?: string | null; created_at?: string | null }[]>([]);
  const [castsDb, setCastsDb] = useState<{ play_id: string; actor: any | null }[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        // 1) franchises（母集合）
        const { data: fData, error: fErr } = await supabase
          .from('franchises')
          .select('id,name,slug,origin_type,origin_note,production_companies')
          .order('name', { ascending: true });

        if (fErr) {
          console.warn('SeriesList franchises fetch error:', fErr);
          setFranchisesDb([]);
          return;
        }
        const frs = (fData ?? []) as FranchiseMetaRow[];
        setFranchisesDb(frs);

        // 2) plays（集計用：最小カラム）
        const { data: pData, error: pErr } = await supabase.from('plays').select('id,franchise_id,period,created_at');

        if (pErr) {
          console.warn('SeriesList plays fetch error:', pErr);
          setPlaysDb([]);
          setCastsDb([]);
          return;
        }
        const ps = (pData ?? []) as any[];
        setPlaysDb(ps);

        // 3) casts（トップ俳優集計用：play_id と actorだけ）
        const playIds = ps.map((p) => p.id).filter(Boolean) as string[];
        if (playIds.length === 0) {
          setCastsDb([]);
          return;
        }

        const { data: cData, error: cErr } = await supabase
          .from('casts')
          .select(
            `
            play_id,
            actor:actors (
              slug,
              name,
              kana,
              profile,
              image_url,
              gender,
              sns,
              tags,
              featured_play_slugs
            )
          `
          )
          .in('play_id', playIds);

        if (cErr) {
          console.warn('SeriesList casts fetch error:', cErr);
          setCastsDb([]);
          return;
        }

        setCastsDb((cData ?? []) as any[]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  // ✅ playId -> franchiseId
  const playFranchiseMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of playsDb) {
      if (p?.id && p?.franchise_id) m.set(p.id, p.franchise_id);
    }
    return m;
  }, [playsDb]);

  // ✅ franchiseId -> stats(playCount/years)
  const statsByFranchiseId = useMemo(() => {
    const m = new Map<string, { playCount: number; start: number; end: number }>();

    for (const p of playsDb) {
      const fid = p.franchise_id;
      if (!fid) continue;

      const y = yearFromPeriod(p.period);
      if (!m.has(fid)) m.set(fid, { playCount: 0, start: 0, end: 0 });

      const cur = m.get(fid)!;
      cur.playCount += 1;

      if (y > 0) {
        cur.start = cur.start === 0 ? y : Math.min(cur.start, y);
        cur.end = cur.end === 0 ? y : Math.max(cur.end, y);
      }
    }

    return m;
  }, [playsDb]);

  // ✅ franchiseId -> topActors
  const topActorsByFranchiseId = useMemo(() => {
    // franchiseId -> actorSlug -> set(playId)
    const bucket = new Map<string, Map<string, { actor: Actor; playSet: Set<string> }>>();

    for (const row of castsDb) {
      const playId = row?.play_id as string | undefined;
      const raw = row?.actor;
      if (!playId || !raw) continue;

      const fid = playFranchiseMap.get(playId);
      if (!fid) continue;

      const actor = normalizeActorRow(raw);
      const slug = actor.slug;
      if (!slug) continue;

      if (!bucket.has(fid)) bucket.set(fid, new Map());
      const actorMap = bucket.get(fid)!;

      if (!actorMap.has(slug)) actorMap.set(slug, { actor, playSet: new Set() });
      actorMap.get(slug)!.playSet.add(playId);
    }

    const out = new Map<string, { actor: Actor; count: number }[]>();
    for (const [fid, actorMap] of bucket.entries()) {
      const tops = Array.from(actorMap.values())
        .map((v) => ({ actor: v.actor, count: v.playSet.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      out.set(fid, tops);
    }

    return out;
  }, [castsDb, playFranchiseMap]);

  // ✅ UI franchises
  const franchises: FranchiseUI[] = useMemo(() => {
    return (franchisesDb ?? []).map((fr) => {
      const s = statsByFranchiseId.get(fr.id) ?? { playCount: 0, start: 0, end: 0 };
      const tops = topActorsByFranchiseId.get(fr.id) ?? [];

      return {
        ...fr,
        playCount: s.playCount,
        years: { start: s.start, end: s.end },
        topActors: tops,
      };
    });
  }, [franchisesDb, statsByFranchiseId, topActorsByFranchiseId]);

  // フィルタ候補（origin_type）
  const originOptions = useMemo(() => {
    const set = new Set<string>();
    for (const f of franchises) {
      const t = normalizeOrigin(f.origin_type);
      if (t) set.add(t);
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'))];
  }, [franchises]);

  // フィルタ＋ソート
  const viewFranchises = useMemo(() => {
    const filtered =
      originFilter === 'all' ? franchises : franchises.filter((f) => normalizeOrigin(f.origin_type) === originFilter);

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'name_asc') return a.name.localeCompare(b.name, 'ja');
      return (b.playCount ?? 0) - (a.playCount ?? 0);
    });

    return sorted;
  }, [franchises, originFilter, sortKey]);

  // ✅ Pagination 계산 (Plays.tsx と同じ)
  const totalPages = Math.max(1, Math.ceil(viewFranchises.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleFranchises = viewFranchises.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // currentPage がはみ出たら戻す（フィルタ変更などで起きる）
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // フィルタ/ソート変更時は1ページ目へ戻す（Plays思想）
  useEffect(() => {
    setCurrentPage(1);
  }, [originFilter, sortKey]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ SEO
  const seoTitle = `シリーズ一覧｜人気舞台シリーズ・フランチャイズ - ${SITE_NAME}`;
  const seoDescription = useMemo(() => {
    const base = '人気舞台シリーズ・フランチャイズを一覧で検索。代表作数や主要キャストから、気になるシリーズの詳細ページへ。';
    const composed = franchises?.length ? `${base}（登録シリーズ：${franchises.length}）` : base;
    return truncate(toPlainText(composed), 155);
  }, [franchises]);

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-[1400px] animate-fade-in-up">
      <SeoHead title={seoTitle} description={seoDescription} robots="index,follow" />
      <Breadcrumbs items={[{ label: 'シリーズ一覧' }]} />

      {/* Header & Sort Controls */}
      <div className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-wide text-white mb-2">シリーズ一覧</h2>
          <p className="text-sm text-slate-400 font-light tracking-wider">人気舞台シリーズ・フランチャイズ</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 bg-theater-surface p-1.5 rounded-lg border border-white/5">
            <span className="pl-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">並び替え</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSortKey('play_count_desc')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                  sortKey === 'play_count_desc'
                    ? 'bg-neon-cyan text-theater-black shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                作品数順
              </button>
              <button
                type="button"
                onClick={() => setSortKey('name_asc')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                  sortKey === 'name_asc'
                    ? 'bg-neon-cyan text-theater-black shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                名前順
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono text-right sm:text-left">
            Total: {viewFranchises.length} / {franchises.length} / Page {currentPage}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mb-8 p-4 text-center text-xs font-mono text-neon-cyan animate-pulse">LOADING DATABASE...</div>
      )}

      {/* Origin Filter */}
      <div className="mb-10 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0">
        <div className="flex gap-2">
          {originOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setOriginFilter(opt)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${
                originFilter === opt
                  ? 'bg-neon-cyan/20 border-neon-cyan/50 text-white shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
              }`}
            >
              {opt === 'all' ? 'すべて' : opt}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleFranchises.map((franchise) => {
          const seriesKey = getSeriesKey(franchise);

          return (
            <Link
              key={franchise.id}
              to={`/series/${encodeURIComponent(seriesKey)}`}
              className="group block bg-theater-surface rounded-xl border border-white/5 p-8 transition-all duration-300 hover:border-neon-cyan/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] hover:-translate-y-1 relative overflow-hidden flex flex-col h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-neon-cyan transition-colors duration-300 line-clamp-2">
                    {franchise.name}
                  </h3>
                  <span className="bg-white/5 text-slate-300 text-xs font-mono px-3 py-1 rounded-full border border-white/10 shrink-0">
                    {franchise.playCount}作品
                  </span>
                </div>

                {normalizeOrigin(franchise.origin_type) && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 bg-white/5 text-slate-400 tracking-wider">
                      {normalizeOrigin(franchise.origin_type)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {franchise.years.start || '----'} - {franchise.years.end || ''}
                  </span>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
                  {franchise.production_companies && franchise.production_companies.length > 0 && (
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-0.5">制作</p>
                      <p className="text-xs text-slate-400 font-medium truncate">{franchise.production_companies.join(', ')}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-1">主要キャスト</p>
                    <div className="text-sm font-bold text-slate-200 leading-snug">
                      {franchise.topActors.length === 0 ? (
                        <span className="text-slate-600 text-xs font-normal italic">情報なし</span>
                      ) : (
                        <>
                          {franchise.topActors.slice(0, 5).map(({ actor }, i) => (
                            <span key={actor.slug}>
                              {i > 0 && <span className="text-slate-600 font-normal mx-1.5">/</span>}
                              <span className="group-hover:text-neon-cyan transition-colors duration-300">{actor.name}</span>
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <span className="text-xs font-bold text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    シリーズ詳細
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State (loading終わって0件の時だけ) */}
      {!loading && viewFranchises.length === 0 && (
        <div className="mt-10 col-span-full py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
          <p className="text-slate-400 mb-2">該当するシリーズはありません</p>
          <button
            type="button"
            onClick={() => setOriginFilter('all')}
            className="text-neon-cyan hover:underline text-sm"
          >
            条件をリセットする
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex justify-center items-center gap-4 mt-16 pt-8 border-t border-white/5">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            « 前へ
          </button>

          <span className="text-sm font-mono text-slate-500">
            Page <span className="text-white font-bold text-base mx-1">{currentPage}</span> / {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            次へ »
          </button>
        </div>
      )}
    </div>
  );
};

export default SeriesList;
