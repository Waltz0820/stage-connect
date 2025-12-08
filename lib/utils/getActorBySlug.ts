import { actors } from '../data/actors';
import { Actor } from '../types';

export function getActorBySlug(slug: string): Actor | undefined {
  return actors.find((actor) => actor.slug === slug);
}
