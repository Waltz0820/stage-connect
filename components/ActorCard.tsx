import React from "react";
import { Link } from "react-router-dom";
import { Actor } from "../lib/types";
import ActorAvatar from "./ActorAvatar";
import FavoriteButton from "./FavoriteButton";

interface ActorCardProps {
  actor: Actor;
  subtitle?: string;
  badge?: string;
}

const ActorCard: React.FC<ActorCardProps> = ({ actor, subtitle, badge }) => {
  const truncateProfile = (text?: string, maxLength: number = 70) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // ✅ DBは image_url、旧コードは imageUrl を見ていたので両対応しておく
  const imageUrl = (actor as any).image_url || (actor as any).imageUrl || undefined;

  return (
    <Link
      to={`/actors/${actor.slug}`}
      className="group block h-full bg-theater-surface rounded-lg border border-white/5 p-6 transition-all duration-300 hover:border-neon-purple/40 hover:shadow-[0_0_20px_rgba(180,108,255,0.15)] hover:-translate-y-1 relative overflow-hidden"
    >
      {/* Favorite Button */}
      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <FavoriteButton slug={actor.slug} type="actor" size="sm" />
      </div>

      {/* Hover Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <div className="relative flex flex-col h-full z-10">
        {/* Header with Avatar */}
        <div className="flex items-start gap-4 mb-4">
          <ActorAvatar imageUrl={imageUrl} alt={actor.name} size="sm" />

          <div className="flex-1 min-w-0">
            {badge && (
              <span className="mb-2 inline-flex max-w-full rounded-full border border-neon-pink/30 bg-neon-pink/10 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-neon-pink">
                {badge}
              </span>
            )}
            {actor.kana && (
              <span className="text-[10px] text-neon-purple font-medium tracking-wider opacity-80 block truncate">
                {actor.kana}
              </span>
            )}
            <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-neon-purple transition-colors duration-300 truncate">
              {actor.name}
            </h3>
            {subtitle && (
              <p className="mt-2 text-sm font-medium text-slate-300 line-clamp-2">
                {subtitle}
              </p>
            )}
            <div className="h-px w-8 bg-gradient-to-r from-neon-purple to-transparent mt-2 group-hover:w-full transition-all duration-500 ease-out opacity-50"></div>
          </div>
        </div>

        <div className="mb-6 flex-grow">
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 font-light">
            {truncateProfile(actor.profile)}
          </p>
        </div>

        {/* ✅ 俳優タグは運用しない方針なので表示を削除 */}
      </div>
    </Link>
  );
};

export default ActorCard;
