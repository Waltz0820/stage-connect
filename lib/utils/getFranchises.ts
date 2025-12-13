import { plays } from '../data/plays';
import { actors as localActors } from '../data/actors';
import { Play, Actor } from '../types';
import { getPlayYear } from './getPlayYear';

export type FranchiseStats = {
  name: string;
  playCount: number;
  years: { start: number; end: number };
  plays: Play[];
  topActors: { actor: Actor; count: number }[];
};

export function getAllFranchises(actorsSource: Actor[] = localActors): FranchiseStats[] {
  const franchiseMap: Record<string, Play[]> = {};

  // 1. Group plays by franchise
  plays.forEach((play) => {
    if (play.franchise) {
      if (!franchiseMap[play.franchise]) {
        franchiseMap[play.franchise] = [];
      }
      franchiseMap[play.franchise].push(play);
    }
  });

  // 2. Calculate stats for each franchise
  const franchises: FranchiseStats[] = Object.entries(franchiseMap).map(
    ([name, franchisePlays]) => {
      // Sort plays by year (newest first)
      const sortedPlays = franchisePlays.sort(
        (a, b) => getPlayYear(b) - getPlayYear(a)
      );

      // Calculate year range
      const years = sortedPlays.map((p) => getPlayYear(p)).filter((y) => y > 0);
      const startYear = years.length > 0 ? Math.min(...years) : 0;
      const endYear = years.length > 0 ? Math.max(...years) : 0;

      // Calculate top actors in this franchise
      const actorCounts: Record<string, number> = {};
      franchisePlays.forEach((play) => {
        play.actorSlugs.forEach((slug) => {
          actorCounts[slug] = (actorCounts[slug] || 0) + 1;
        });
      });

      const topActors = Object.entries(actorCounts)
        .map(([slug, count]) => {
          const actor = actorsSource.find((a) => a.slug === slug);
          return actor ? { actor, count } : null;
        })
        .filter((item): item is { actor: Actor; count: number } => item !== null)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        name,
        playCount: franchisePlays.length,
        years: { start: startYear, end: endYear },
        plays: sortedPlays,
        topActors,
      };
    }
  );

  return franchises.sort((a, b) => b.playCount - a.playCount);
}

export function getFranchiseByName(
  name: string,
  actorsSource: Actor[] = localActors
): FranchiseStats | undefined {
  const all = getAllFranchises(actorsSource);
  return all.find((f) => f.name === decodeURIComponent(name));
}
