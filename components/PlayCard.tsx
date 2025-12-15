import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, GENRE_LABELS } from '../lib/types';
import TagBadge from './TagBadge';
import FavoriteButton from './FavoriteButton';

interface PlayCardProps {
  play: Play;
  className?: string;
}

const PlayCard: React.FC<PlayCardProps> = ({ play, className = '' }) => {
  const navigate = useNavigate();

  const genreKey = (play as any)?.genre as keyof typeof GENRE_LABELS | undefined;
  const genreLabel = genreKey && GENRE_LABELS[genreKey] ? GENRE_LABELS[genreKey] : '未分類';

  const vod = (play as any)?.vod as
    | { dmm?: string; danime?: string; unext?: string; [key: string]: any }
    | undefined;

  const hasVod = Boolean(vod?.dmm || vod?.danime || vod?.unext);

  const goDetail = () => navigate(`/plays/${play.slug}`);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goDetail();
    }
  };

  const stop: React.MouseEventHandler = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goDetail}
      onKeyDown={onKeyDown}
      aria-label={`${play.title} の詳細を見る`}
      className={`group flex flex-col bg-theater-surface rounded-lg border border-white/5 p-6 transition-all duration-300 hover:border-neon-pink/40 hover:shadow-[0_0_20px_rgba(233,68,166,0.15)] hover:-translate-y-1 relative overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50 ${
        className || 'h-full'
      }`}
    >
      {/* Favorite Button */}
      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <FavoriteButton slug={play.slug} type="play" size="sm" />
      </div>

      {/* Hover Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <div className="relative flex flex-col flex-grow z-10">
        {/* Top meta row */}
        <div className="mb-2">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            {/* Genre Badge */}
            <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-white/20 text-slate-300 bg-white/5 uppercase">
              {genreLabel}
            </span>

            {/* VOD Availability Badge */}
            {hasVod && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-white/15 text-slate-200 bg-white/5 uppercase tracking-widest">
                VOD
              </span>
            )}
          </div>

          {play.franchise && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-neon-pink mb-2 block drop-shadow-[0_0_5px_rgba(233,68,166,0.4)]">
              {play.franchise}
            </span>
          )}

          <h3 className="text-lg font-bold text-white leading-snug tracking-wide group-hover:text-neon-pink transition-colors duration-300">
            {play.title}
          </h3>
        </div>

        {/* Summary */}
        <div className="mt-4 mb-4 flex-grow">
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 font-light">
            {play.summary}
          </p>
        </div>

        {/* VOD mini-CTA */}
        {hasVod && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                配信
              </span>
              <span className="text-[10px] text-slate-600">外部リンク</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {vod?.dmm && (
                <a
                  href={vod.dmm}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stop}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-[#E53935]/10 border border-[#E53935]/30 text-[#ff8a80] text-[11px] font-bold hover:bg-[#E53935]/20 hover:border-[#E53935] hover:shadow-[0_0_12px_rgba(229,57,53,0.25)] transition-all"
                >
                  DMM TV
                </a>
              )}
              {vod?.danime && (
                <a
                  href={vod.danime}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stop}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-[#FF9800]/10 border border-[#FF9800]/30 text-[#ffcc80] text-[11px] font-bold hover:bg-[#FF9800]/20 hover:border-[#FF9800] hover:shadow-[0_0_12px_rgba(255,152,0,0.25)] transition-all"
                >
                  dアニメ
                </a>
              )}
              {vod?.unext && (
                <a
                  href={vod.unext}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stop}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-[#1E88E5]/10 border border-[#1E88E5]/30 text-[#90caf9] text-[11px] font-bold hover:bg-[#1E88E5]/20 hover:border-[#1E88E5] hover:shadow-[0_0_12px_rgba(30,136,229,0.25)] transition-all"
                >
                  U-NEXT
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
          <div className="flex flex-wrap gap-2">
            {play.tags && play.tags.slice(0, 2).map((tag) => <TagBadge key={tag}>{tag}</TagBadge>)}
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors flex items-center">
            詳細を見る
            <svg
              className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayCard;
