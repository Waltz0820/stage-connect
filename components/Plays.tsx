// src/components/Plays.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PlayCard from './PlayCard';
import { getPlayYear } from '../lib/utils/getPlayYear';
import Breadcrumbs from './Breadcrumbs';
import { PlayGenre, GENRE_LABELS } from '../lib/types';
import { normalizeTagsFromJoin } from '../lib/utils/normalizeTagsFromJoin';
import SeoHead from './SeoHead';
import { useSiteUrl } from '../lib/hooks/useSiteUrl';

type PlayLike = {
  id?: string;
  slug: string;
  title: string;
  summary?: string | null;
  period?: string | null;
  venue?: string | null;
  vod?: any;
  tags?: string[] | null;
  franchise?: string | null;
  genre?: PlayGenre | null;
};



const normalizePlayRow = (p: any): PlayLike => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  summary: p.summary ?? null,
  period: p.period ?? null,
  venue: p.venue ?? null,
  vod: p.vod ?? null,

  // ✅ ここが肝：DBの join を正として tags を作る
  tags: normalizeTagsFromJoin(p),

  franchise: p.franchise?.name ?? p.franchise ?? null,
  genre: (p.genre as PlayGenre | null) ?? null,
});

const SITE_NAME = 'Stage Connect';
const STORAGE_KEY = 'plays-list-state';

const Plays: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortOrder, setSortOrder] = useState<'new' | 'old'>(() => {
    const param = searchParams.get('sort');
    if (param === 'old' || param === 'new') return param;
    if (typeof window === 'undefined') return 'new';
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return 'new';
    try {
      const parsed = JSON.parse(saved) as { sortOrder?: 'new' | 'old' };
      return parsed.sortOrder === 'old' ? 'old' : 'new';
    } catch {
      return 'new';
    }
  });
  const [selectedGenre, setSelectedGenre] = useState<'all' | PlayGenre>(() => {
    const param = searchParams.get('genre');
    if (param && (param === 'all' || param in GENRE_LABELS)) return param as 'all' | PlayGenre;
    if (typeof window === 'undefined') return 'all';
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return 'all';
    try {
      const parsed = JSON.parse(saved) as { selectedGenre?: 'all' | PlayGenre };
      return parsed.selectedGenre && (parsed.selectedGenre === 'all' || parsed.selectedGenre in GENRE_LABELS)
        ? parsed.selectedGenre
        : 'all';
    } catch {
      return 'all';
    }
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const param = Number(searchParams.get('page'));
    if (Number.isFinite(param) && param > 0) return param;
    if (typeof window === 'undefined') return 1;
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return 1;
    try {
      const parsed = JSON.parse(saved) as { currentPage?: number };
      return parsed.currentPage && parsed.currentPage > 0 ? parsed.currentPage : 1;
    } catch {
      return 1;
    }
  });
  const ITEMS_PER_PAGE = 10;

  const [playsDb, setPlaysDb] = useState<PlayLike[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ 初回：DBから作品を取得
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('plays')
          .select(
            `
            id,
            slug,
            title,
            summary,
            period,
            venue,
            vod,
            genre,
            franchise:franchises ( name ),
            play_tags:play_tags (
              tag:tags ( name )
            )
          `
          );

        if (cancelled) return;

        if (error) {
          console.error('Plays fetch error:', error);
          setError('作品一覧の取得に失敗しました。');
          setPlaysDb([]);
          return;
        }

        const normalized = (data ?? [])
          .filter((p: any) => p?.slug && p?.title)
          .map(normalizePlayRow);

        setPlaysDb(normalized);
      } catch (e) {
        console.error('Plays fetch exception:', e);
        if (!cancelled) {
          setError('作品一覧の取得に失敗しました。');
          setPlaysDb([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSortChange = (order: 'new' | 'old') => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleGenreChange = (genre: 'all' | PlayGenre) => {
    setSelectedGenre(genre);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ジャンルリスト
  const genres: ('all' | PlayGenre)[] = useMemo(
    () => ['all', ...(Object.keys(GENRE_LABELS) as PlayGenre[])],
    []
  );

  const plays = playsDb ?? [];

  // フィルタリング
  const filteredPlays = useMemo(() => {
    if (selectedGenre === 'all') return plays;
    return plays.filter((play) => play.genre === selectedGenre);
  }, [plays, selectedGenre]);

  // ソート（getPlayYear 互換維持）
  const sortedPlays = useMemo(() => {
    const arr = [...filteredPlays];

    arr.sort((a, b) => {
      const yearA = getPlayYear(a as any);
      const yearB = getPlayYear(b as any);

      if (sortOrder === 'new') {
        if (yearA === 0) return 1;
        if (yearB === 0) return -1;
        return yearB - yearA;
      } else {
        if (yearA === 0) return 1;
        if (yearB === 0) return -1;
        return yearA - yearB;
      }
    });

    return arr;
  }, [filteredPlays, sortOrder]);

  // ページネーション
  const totalPages = Math.max(1, Math.ceil(sortedPlays.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visiblePlays = sortedPlays.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // currentPage がはみ出たら戻す（フィルタ変更で起こり得る）
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ sortOrder, selectedGenre, currentPage })
    );
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(currentPage));
    nextParams.set('sort', sortOrder);
    nextParams.set('genre', selectedGenre);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [sortOrder, selectedGenre, currentPage, searchParams, setSearchParams]);

  useEffect(() => {
    const pageParam = Number(searchParams.get('page'));
    const nextPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const sortParam = searchParams.get('sort');
    const nextSort: 'new' | 'old' = sortParam === 'old' ? 'old' : 'new';
    const genreParam = searchParams.get('genre');
    const nextGenre =
      genreParam && (genreParam === 'all' || genreParam in GENRE_LABELS)
        ? (genreParam as 'all' | PlayGenre)
        : 'all';

    if (currentPage !== nextPage) setCurrentPage(nextPage);
    if (sortOrder !== nextSort) setSortOrder(nextSort);
    if (selectedGenre !== nextGenre) setSelectedGenre(nextGenre);
  }, [searchParams]);

  // ✅ SEO meta（ActorDetailと同じ思想で最低限）
  const pageTitle = `作品一覧｜舞台作品アーカイブ - ${SITE_NAME}`;
  const pageDescription = `${SITE_NAME}の舞台作品アーカイブ。ジャンル別フィルタと公開順ソートで作品を探せます。`;

  const siteUrl = useSiteUrl();
  const canonical = `${siteUrl}/plays`;

  // ✅ 5×2のスケルトン（=10枚）を固定で出す
  const skeletonCards = useMemo(() => Array.from({ length: ITEMS_PER_PAGE }, (_, i) => i), [ITEMS_PER_PAGE]);

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-[1400px] animate-fade-in-up">
      <SeoHead title={pageTitle} description={pageDescription} canonical={canonical} robots="index,follow" />

      <Breadcrumbs items={[{ label: '作品一覧' }]} />

      <div className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-wide text-white mb-2">作品一覧</h2>
          <p className="text-sm text-slate-400 font-light tracking-wider">舞台作品アーカイブ</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* ソートボタン */}
          <div className="flex items-center gap-3 bg-theater-surface p-1.5 rounded-lg border border-white/5">
            <span className="pl-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">公開順</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleSortChange('new')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${sortOrder === 'new'
                  ? 'bg-neon-pink text-white shadow-[0_0_10px_rgba(233,68,166,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                新しい順
              </button>
              <button
                onClick={() => handleSortChange('old')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${sortOrder === 'old'
                  ? 'bg-neon-pink text-white shadow-[0_0_10px_rgba(233,68,166,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                古い順
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono text-right sm:text-left">
            Total: {sortedPlays.length} / Page {currentPage}
          </div>
        </div>
      </div>

      {/* ✅ エラー */}
      {error && (
        <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-slate-200 font-bold mb-1">読み込みに失敗しました</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      )}

      {/* ジャンルフィルタ */}
      <div className="mb-10 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0">
        <div className="flex gap-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreChange(genre)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${selectedGenre === genre
                ? 'bg-neon-pink/20 border-neon-pink/50 text-white shadow-[0_0_15px_rgba(233,68,166,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                }`}
            >
              {genre === 'all' ? 'すべて' : GENRE_LABELS[genre]}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ LOADING DATABASE...（ネオンピンク） */}
      {loading && (
        <div className="mb-6 text-center text-xs font-mono tracking-widest text-neon-pink animate-pulse">
          LOADING DATABASE...
        </div>
      )}

      {/* ✅ ローディング：5×2 のスケルトン（=10枚） */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-h-[50vh] animate-pulse">
          {skeletonCards.map((i) => (
            <div key={i} className="bg-theater-surface rounded-xl border border-white/10 p-6 flex flex-col h-full">
              {/* title */}
              <div className="h-5 w-3/4 bg-white/10 rounded mb-3" />
              {/* meta */}
              <div className="h-3 w-1/2 bg-white/10 rounded mb-5" />
              {/* body placeholder */}
              <div className="flex-1 space-y-3">
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-11/12 bg-white/5 rounded" />
                <div className="h-3 w-9/12 bg-white/5 rounded" />
              </div>
              {/* footer */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="h-3 w-2/3 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-h-[50vh]">
            {visiblePlays.length > 0 ? (
              visiblePlays.map((play) => <PlayCard key={play.slug} play={play as any} />)
            ) : (
              <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-slate-400 mb-2">該当する作品はありません</p>
                <button onClick={() => handleGenreChange('all')} className="text-neon-pink hover:underline text-sm">
                  条件をリセットする
                </button>
              </div>
            )}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
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
        </>
      )}
    </div>
  );
};

export default Plays;
