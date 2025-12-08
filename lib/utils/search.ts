import { actors } from '../data/actors';
import { plays } from '../data/plays';
import { Actor, Play } from '../types';

export type SearchResults = {
  actors: Actor[];
  plays: Play[];
};

/**
 * 検索クエリに基づいて俳優と作品を検索する
 * 簡易的なFuzzy Searchの実装（部分一致、複数フィールド検索）
 */
export function searchContent(query: string): SearchResults {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return { actors: [], plays: [] };
  }

  // クエリをスペースで分割してAND検索に対応できるようにする
  const terms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);

  const matchedActors = actors.filter((actor) => {
    const targetText = [
      actor.name,
      actor.kana || '',
      actor.profile || '',
      ...(actor.tags || [])
    ].join(' ').toLowerCase();

    return terms.every(term => targetText.includes(term));
  });

  const matchedPlays = plays.filter((play) => {
    const targetText = [
      play.title,
      play.franchise || '',
      play.summary || '',
      ...(play.tags || [])
    ].join(' ').toLowerCase();

    return terms.every(term => targetText.includes(term));
  });

  return {
    actors: matchedActors,
    plays: matchedPlays
  };
}