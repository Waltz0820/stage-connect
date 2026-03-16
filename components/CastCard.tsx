import React from "react";
import { Link } from "react-router-dom";
import type { Actor } from "../lib/types";
import ActorAvatar from "./ActorAvatar";

type CastCardProps = {
  actor: Actor;
  roleName?: string;
  badge?: string;
};

const CastCard: React.FC<CastCardProps> = ({ actor, roleName, badge }) => {
  const imageUrl = (actor as any).image_url || (actor as any).imageUrl || undefined;

  return (
    <Link
      to={`/actors/${actor.slug}`}
      className="group block h-full overflow-hidden rounded-lg border border-white/5 bg-theater-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-neon-cyan/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.12)]"
    >
      <div className="flex items-start gap-4">
        <ActorAvatar imageUrl={imageUrl} alt={actor.name} size="sm" />

        <div className="min-w-0 flex-1">
          {badge && (
            <span className="mb-2 inline-flex max-w-full rounded-full border border-neon-pink/30 bg-neon-pink/10 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-neon-pink">
              {badge}
            </span>
          )}

          {actor.kana && (
            <span className="block truncate text-[10px] font-medium tracking-wider text-neon-cyan/80">
              {actor.kana}
            </span>
          )}

          <h3 className="truncate text-lg font-bold tracking-wide text-white transition-colors duration-300 group-hover:text-neon-cyan">
            {actor.name}
          </h3>

          {roleName && (
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-slate-300">
              {roleName}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CastCard;
