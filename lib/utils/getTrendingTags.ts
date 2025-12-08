import { actors } from '../data/actors';
import { plays } from '../data/plays';

export type TagStats = {
  tag: string;
  count: number;
  rank: number;
};

export function getTrendingTags(limit: number = 20): TagStats[] {
  const tagCounts: Record<string, number> = {};

  // Count actor tags
  actors.forEach(actor => {
    actor.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Count play tags
  plays.forEach(play => {
    play.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}