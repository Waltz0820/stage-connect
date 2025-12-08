import { plays } from '../data/plays';
import { Play } from '../types';

export function getPlayBySlug(slug: string): Play | undefined {
  return plays.find((play) => play.slug === slug);
}
