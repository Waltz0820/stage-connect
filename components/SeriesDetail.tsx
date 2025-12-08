import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFranchiseByName } from '../lib/utils/getFranchises';
import PlayCard from './PlayCard';
import ActorAvatar from './ActorAvatar';
import Breadcrumbs from './Breadcrumbs';

const SeriesDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const franchise = name ? getFranchiseByName(name) : undefined;

  if (!franchise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white">シリーズが見つかりませんでした</h2>
        <Link to="/series" className="mt-8 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 hover:border-neon-cyan/50 transition-colors">
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <Breadcrumbs 
        items={[
          { label: 'シリーズ一覧', to: '/series' },
          { label: franchise.name }
        ]} 
      />

      {/* Header */}
      <div className="mb-16 text-center">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase">
          SERIES ARCHIVE
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          {franchise.name}
        </h1>
        <p className="text-slate-400 text-lg">
          全{franchise.playCount}作品 ({franchise.years.start} - {franchise.years.end > 0 ? franchise.years.end : '現在'})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* Sidebar: Regular Cast */}
        <div className="lg:col-span-4 lg:order-2">
           <div className="bg-theater-surface/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-24">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan"></span>
                 シリーズ・レギュラー
              </h3>
              <div className="space-y-4">
                 {franchise.topActors.map(({ actor, count }, index) => (
                    <Link 
                       key={actor.slug} 
                       to={`/actors/${actor.slug}`}
                       className="flex items-center gap-3 group p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                       <div className="relative">
                          <ActorAvatar imageUrl={actor.imageUrl} alt={actor.name} size="sm" />
                          {index < 3 && (
                             <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-cyan text-black text-[10px] font-bold flex items-center justify-center border border-white">
                                {index + 1}
                             </div>
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-200 group-hover:text-neon-cyan transition-colors truncate">
                             {actor.name}
                          </p>
                          <p className="text-xs text-slate-500">
                             {count}作品出演
                          </p>
                       </div>
                    </Link>
                 ))}
              </div>
           </div>
        </div>

        {/* Main: Timeline */}
        <div className="lg:col-span-8 lg:order-1 space-y-12">
           <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[19px] top-2 bottom-0 w-px bg-gradient-to-b from-neon-cyan/50 via-neon-cyan/20 to-transparent"></div>

              <div className="space-y-6">
                 {franchise.plays.map((play) => (
                    <div 
                      key={play.slug} 
                      className="relative pl-12 flex flex-col"
                    >
                       {/* Dot */}
                       <div className="absolute left-[15px] top-0 w-2.5 h-2.5 rounded-full bg-neon-cyan shadow-[0_0_10px_#00FFFF] ring-4 ring-theater-black"></div>
                       
                       {/* Year Label */}
                       <div className="mb-1 text-xs font-mono text-neon-cyan/80 tracking-wider">
                          {play.period || 'Year Unknown'}
                       </div>

                       {/* List表示なので h-auto を適用して高さを自動調整 */}
                       <PlayCard play={play} className="h-auto w-full" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetail;