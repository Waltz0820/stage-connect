// src/components/SeriesList.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';
import SeoHead from './SeoHead';
import { supabase } from '../lib/supabase';
import { getAllFranchises, FranchiseStats } from '../lib/utils/getFranchises';
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

type FranchiseUI = FranchiseStats & {
  meta?: FranchiseMetaRow | null;
};

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

const SeriesList: React.FC = () => {
  const [actorsDb, setActorsDb] = useState<Actor[] | null>(null);
  const [frMetaDb, setFrMetaDb] = useState<FranchiseMetaRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ UI state
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('play_count_desc');

  // -------------------------
  // ✅ Data fetch（actors + franchises meta）
  // -------------------------
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        // 1) actors（既存の統計生成用）
        const { data: aData, error: aErr } = await supabase
          .from('actors')
          .select('slug,name,kana,profile,image_url,gender,sns,featured_play_slugs,tags');

        if (aErr) {
          console.warn('SeriesList actors fetch error:', aErr);
          setActorsDb(null); // ローカルフォールバック
        } else {
          setActorsDb((aData ?? []).map(normalizeActorRow));
        }

        // 2) franchises（固定情報: origin_type 等）
        const { data: fData, error: fErr } = await supabase
          .from('franchises')
          .select('id,name,slug,origin_type,origin_note,production_companies');

        if (fErr) {
          console.warn('SeriesList franchises meta fetch error:', fErr);
          setFrMetaDb(null);
        } else {
          setFrMetaDb((fData ?? []) as any);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  // -------------------------
  // ✅ Franchises（DB優先→ローカル）
  // -------------------------
  const baseFranchises: FranchiseStats[] = useMemo(() => {
    // actorsDbがロードされていればそれを使い、なければ静的データを使う
    return actorsDb ? getAllFranchises(actorsDb) : getAllFranchises();
  }, [actorsDb]);

  // meta を name でマージ
  const franchises: FranchiseUI[] = useMemo(() => {
    const metaMap = new Map<string, FranchiseMetaRow>();
    (frMetaDb ?? []).forEach((m) => {
      if (m?.name) metaMap.set(m.name, m);
    });

    return baseFranchises.map((f) => ({
      ...f,
      meta: metaMap.get(f.name) ?? null,
    }));
  }, [baseFranchises, frMetaDb]);

  // フィルタ候補（origin_type）
  const originOptions = useMemo(() => {
    const set = new Set<string>();
    for (const f of franchises) {
      const t = normalizeOrigin(f.meta?.origin_type);
      if (t) set.add(t);
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'))];
  }, [franchises]);

  // フィルタ＋ソート
  const viewFranchises = useMemo(() => {
    const filtered =
      originFilter === 'all'
        ? franchises
        : franchises.filter((f) => normalizeOrigin(f.meta?.origin_type) === originFilter);

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'name_asc') return a.name.localeCompare(b.name, 'ja');
      // play_count_desc
      return (b.playCount ?? 0) - (a.playCount ?? 0);
    });

    return sorted;
  }, [franchises, originFilter, sortKey]);

  // -------------------------
  // ✅ SEO（SeoHead）
  // -------------------------
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
          {/* ソートボタン (Segmented Control Style) */}
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
            Total: {viewFranchises.length} / {franchises.length}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mb-8 p-4 text-center text-xs font-mono text-neon-cyan animate-pulse">
          LOADING DATABASE...
        </div>
      )}

      {/* Origin Filter (Pill List Style) */}
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
        {viewFranchises.map((franchise) => (
          <Link
            key={franchise.name}
            to={`/series/${encodeURIComponent(franchise.name)}`}
            className="group block bg-theater-surface rounded-xl border border-white/5 p-8 transition-all duration-300 hover:border-neon-cyan/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] hover:-translate-y-1 relative overflow-hidden flex flex-col h-full"
          >
            {/* Hover Background Gradient */}
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

              {/* Origin Type Badge */}
              {normalizeOrigin(franchise.meta?.origin_type) && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 bg-white/5 text-slate-400 tracking-wider">
                    {normalizeOrigin(franchise.meta?.origin_type)}
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
                  {franchise.years.start} - {franchise.years.end > 0 ? franchise.years.end : ''}
                </span>
              </div>

              {/* ✅ 写真なし：制作 + 主要キャストをテキストで */}
              <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
                {/* 制作会社 */}
                {franchise.meta?.production_companies && franchise.meta.production_companies.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-0.5">制作</p>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {franchise.meta.production_companies.join(', ')}
                    </p>
                  </div>
                )}

                {/* 主要キャスト（テキスト） */}
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
                        {franchise.topActors.length > 5 && (
                          <span className="text-slate-500 text-xs font-normal ml-1.5">他</span>
                        )}
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
        ))}
      </div>
    </div>
  );
};

export default SeriesList;
