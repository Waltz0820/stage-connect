import { plays } from '../data/plays';
import { Play } from '../types';

export function getPlaysByActorSlug(actorSlug: string): Play[] {
  return plays.filter((play) => play.actorSlugs.includes(actorSlug));
}
