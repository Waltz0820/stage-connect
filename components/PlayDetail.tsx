import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayBySlug } from '../lib/utils/getPlayBySlug';
import { getActorsByPlaySlug } from '../lib/utils/getActorsByPlaySlug';
import ActorCard from './ActorCard';
import TagBadge from './TagBadge';
import FavoriteButton from './FavoriteButton';
import ShareButton from './ShareButton';
import Breadcrumbs from './Breadcrumbs';

const PlayDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const play = slug ? getPlayBySlug(slug) : undefined;

  if (!play) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white">作品が見つかりませんでした</h2>
        <p className="mt-2 text-slate-400">お探しの作品は見つかりませんでした。</p>
        <Link to="/plays" className="mt-8 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 hover:border-neon-purple/50 transition-colors">
          一覧に戻る
        </Link>
      </div>
    );
  }

  const cast = slug ? getActorsByPlaySlug(slug) : [];
  const hasVodLinks = play.vod && (play.vod.dmm || play.vod.danime || play.vod.unext);

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <Breadcrumbs 
        items={[
          { label: '作品一覧', to: '/plays' },
          { label: play.title }
        ]} 
      />

      {/* Header Section */}
      <div className="mb-16 border-b border-white/10 pb-8">
        <div className="flex flex-col gap-4">
          <div>
            {play.franchise && (
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-neon-pink mb-4 bg-neon-pink/10 px-3 py-1 rounded border border-neon-pink/20 shadow-[0_0_10px_rgba(233,68,166,0.2)]">
                {play.franchise}
              </span>
            )}
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                {play.title}
              </h1>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <FavoriteButton slug={play.slug} type="play" size="lg" className="shrink-0" />
              <ShareButton title={play.title} text={`${play.title}の作品情報 | Stage Connect`} className="shrink-0" />
            </div>
            
            {play.tags && play.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {play.tags.map((tag) => (
                  <TagBadge key={tag}>{tag}</TagBadge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
        <div className="md:col-span-2 space-y-12">
          {/* Summary */}
          <section>
             <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide">
              あらすじ
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300 leading-8 font-light">
              {play.summary || '概要情報はまだありません。'}
            </div>
          </section>

          {/* Info Box */}
           <section className="bg-theater-surface rounded-xl border border-white/5 p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
              公演情報
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <span className="min-w-[4rem] text-sm font-bold text-neon-purple tracking-wider">
                  期間
                </span>
                <span className="text-slate-200 text-sm font-medium">
                  {play.period || '未定'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <span className="min-w-[4rem] text-sm font-bold text-neon-purple tracking-wider">
                  劇場
                </span>
                <span className="text-slate-200 text-sm font-medium">
                  {play.venue || '未定'}
                </span>
              </div>
            </div>
          </section>

          {/* VOD Section */}
          {hasVodLinks && (
            <section className="pt-4">
              <h2 className="text-lg font-bold text-white mb-6 tracking-wide flex items-center gap-2">
                配信で見る
                <span className="text-[10px] font-normal text-slate-500 border border-slate-700 px-2 py-0.5 rounded ml-2">外部リンク</span>
              </h2>
              <div className="flex flex-wrap gap-4">
                {play.vod?.dmm && (
                  <a
                    href={play.vod.dmm}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#E53935]/10 border border-[#E53935]/30 text-[#ff8a80] text-sm font-bold hover:bg-[#E53935]/20 hover:border-[#E53935] hover:shadow-[0_0_15px_rgba(229,57,53,0.3)] transition-all duration-300 min-w-[140px]"
                  >
                    DMM TV
                  </a>
                )}
                {play.vod?.danime && (
                  <a
                    href={play.vod.danime}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#FF9800]/10 border border-[#FF9800]/30 text-[#ffcc80] text-sm font-bold hover:bg-[#FF9800]/20 hover:border-[#FF9800] hover:shadow-[0_0_15px_rgba(255,152,0,0.3)] transition-all duration-300 min-w-[140px]"
                  >
                    dアニメストア
                  </a>
                )}
                {play.vod?.unext && (
                  <a
                    href={play.vod.unext}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1E88E5]/10 border border-[#1E88E5]/30 text-[#90caf9] text-sm font-bold hover:bg-[#1E88E5]/20 hover:border-[#1E88E5] hover:shadow-[0_0_15px_rgba(30,136,229,0.3)] transition-all duration-300 min-w-[140px]"
                  >
                    U-NEXT
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Cast Section */}
      <section className="pt-16 border-t border-white/10 mt-16">
        <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">
          出演キャスト
        </h2>
        {cast.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cast.map((actor) => (
              <ActorCard key={actor.slug} actor={actor} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 italic">登録されている出演俳優はいません。</p>
        )}
      </section>
    </div>
  );
};

export default PlayDetail;