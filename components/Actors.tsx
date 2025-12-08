import React, { useState } from 'react';
import { actors } from '../lib/data/actors';
import { Gender } from '../lib/types';
import ActorCard from './ActorCard';
import Breadcrumbs from './Breadcrumbs';

const Actors: React.FC = () => {
  const [genderFilter, setGenderFilter] = useState<'all' | Gender>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // 名前順にソート
  const sortedActors = [...actors].sort((a, b) => {
    const nameA = a.kana || a.name;
    const nameB = b.kana || b.name;
    return nameA.localeCompare(nameB, 'ja');
  });

  // 性別フィルタリング
  const filteredActors = sortedActors.filter((actor) => {
    if (genderFilter === 'all') return true;
    return actor.gender === genderFilter;
  });

  // ページネーション処理
  const totalPages = Math.ceil(filteredActors.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleActors = filteredActors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleFilterChange = (filter: 'all' | Gender) => {
    setGenderFilter(filter);
    setCurrentPage(1); // フィルタ変更時は1ページ目に戻す
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-[1400px] animate-fade-in-up">
      <Breadcrumbs items={[{ label: 'キャスト一覧' }]} />

      <div className="mb-8 border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-wide text-white mb-2">
            キャスト一覧
          </h2>
          <p className="text-sm text-slate-400 font-light tracking-wider">
            登録キャスト一覧（五十音順）
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          登録数: {filteredActors.length} / Page {currentPage}
        </div>
      </div>

      {/* 性別フィルタタブ */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${
            genderFilter === 'all'
              ? 'bg-neon-purple/20 border-neon-purple/50 text-white shadow-[0_0_15px_rgba(180,108,255,0.3)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => handleFilterChange('male')}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${
            genderFilter === 'male'
              ? 'bg-neon-cyan/20 border-neon-cyan/50 text-white shadow-[0_0_15px_rgba(0,255,255,0.3)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
          }`}
        >
          男性
        </button>
        <button
          onClick={() => handleFilterChange('female')}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${
            genderFilter === 'female'
              ? 'bg-neon-pink/20 border-neon-pink/50 text-white shadow-[0_0_15px_rgba(233,68,166,0.3)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
          }`}
        >
          女性
        </button>
      </div>

      {filteredActors.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-h-[50vh]">
            {visibleActors.map((actor) => (
              <ActorCard key={actor.slug} actor={actor} />
            ))}
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
      ) : (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
          <p className="text-slate-400 mb-2">該当するキャストはいません</p>
          <button 
            onClick={() => handleFilterChange('all')}
            className="text-neon-purple hover:underline text-sm"
          >
            条件をリセットする
          </button>
        </div>
      )}
    </div>
  );
};

export default Actors;