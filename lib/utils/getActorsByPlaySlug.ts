import { actors } from '../data/actors';
import { plays } from '../data/plays';
import { Actor } from '../types';

export function getActorsByPlaySlug(playSlug: string): Actor[] {
  const play = plays.find((p) => p.slug === playSlug);
  if (!play) {
    return [];
  }

  // play.actorSlugs の順序に従って actor を取得し、存在しないものは除外
  return play.actorSlugs
    .map((slug) => actors.find((actor) => actor.slug === slug))
    .filter((actor): actor is Actor => actor !== undefined);
}
