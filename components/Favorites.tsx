import React, { useState } from 'react';
import { useFavorites } from '../lib/hooks/useFavorites';
import { actors } from '../lib/data/actors';
import { plays } from '../lib/data/plays';
import ActorCard from './ActorCard';
import PlayCard from './PlayCard';
import { Link } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';

const Favorites: React.FC = () => {
  const { favoriteActors, favoritePlays } = useFavorites();
  const [activeTab, setActiveTab] = useState<'actors' | 'plays'>('actors');

  // IDから実際のデータオブジェクトを取得
  const savedActors = actors.filter(a => favoriteActors.includes(a.slug));
  const savedPlays = plays.filter(p => favoritePlays.includes(p.slug));

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-[1400px] animate-fade-in-up">
      <Breadcrumbs items={[{ label: 'お気に入り' }]} />

      <div className="mb-12 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-bold tracking-wide text-white mb-2 flex items-center gap-3">
          <span className="text-neon-pink">♥</span> お気に入り
        </h2>
        <p className="text-sm text-slate-400 font-light tracking-wider">
          保存したキャスト・作品リスト
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('actors')}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${
            activeTab === 'actors'
              ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(180,108,255,0.4)]'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          キャスト <span className="ml-2 text-xs opacity-80 bg-black/20 px-2 py-0.5 rounded-full">{savedActors.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('plays')}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${
            activeTab === 'plays'
              ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(233,68,166,0.4)]'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          作品 <span className="ml-2 text-xs opacity-80 bg-black/20 px-2 py-0.5 rounded-full">{savedPlays.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[50vh]">
        {activeTab === 'actors' ? (
          savedActors.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {savedActors.map(actor => (
                <ActorCard key={actor.slug} actor={actor} />
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white/5 rounded-xl border border-dashed border-white/10">
               <p className="mb-4">お気に入りのキャストはまだありません</p>
               <Link to="/actors" className="text-neon-purple hover:underline text-sm font-bold">キャスト一覧から探す</Link>
             </div>
          )
        ) : (
          savedPlays.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {savedPlays.map(play => (
                <PlayCard key={play.slug} play={play} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white/5 rounded-xl border border-dashed border-white/10">
               <p className="mb-4">お気に入りの作品はまだありません</p>
               <Link to="/plays" className="text-neon-pink hover:underline text-sm font-bold">作品一覧から探す</Link>
             </div>
          )
        )}
      </div>
    </div>
  );
};

export default Favorites;