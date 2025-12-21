// src/components/Plays.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import PlayCard from './PlayCard';
import { getPlayYear } from '../lib/utils/getPlayYear';
import Breadcrumbs from './Breadcrumbs';
import { PlayGenre, GENRE_LABELS } from '../lib/types';

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
  tags: (p.tags as string[] | null) ?? null,
  franchise: p.franchise?.name ?? p.franchise ?? null,
  genre: (p.genre as PlayGenre | null) ?? null,
});

const SITE_NAME = 'Stage Connect';

const Plays: React.FC = () => {
  const [sortOrder, setSortOrder] = useState<'new' | 'old'>('new');
  const [selectedGenre, setSelectedGenre] = useState<'all' | PlayGenre>('all');
  const [currentPage, setCurrentPage] = useState(1);
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
            tags,
            genre,
            franchise:franchises ( name )
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

  // ✅ SEO meta（ActorDetailと同じ思想で最低限）
  const pageTitle = `作品一覧｜舞台作品アーカイブ - ${SITE_NAME}`;
  const pageDescription = `${SITE_NAME}の舞台作品アーカイブ。ジャンル別フィルタと公開順ソートで作品を探せます。`;

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-[1400px] animate-fade-in-up">
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />

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
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                  sortOrder === 'new'
                    ? 'bg-neon-pink text-white shadow-[0_0_10px_rgba(233,68,166,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                新しい順
              </button>
              <button
                onClick={() => handleSortChange('old')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                  sortOrder === 'old'
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
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${
                selectedGenre === genre
                  ? 'bg-neon-pink/20 border-neon-pink/50 text-white shadow-[0_0_15px_rgba(233,68,166,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
              }`}
            >
              {genre === 'all' ? 'すべて' : GENRE_LABELS[genre]}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ ローディング */}
      {loading ? (
        <div className="rounded-2xl bg-theater-surface border border-white/10 p-8 animate-pulse min-h-[50vh]">
          <div className="h-6 w-40 bg-white/10 rounded mb-4" />
          <div className="h-4 w-24 bg-white/10 rounded mb-6" />
          <div className="h-24 w-full bg-white/5 rounded" />
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
