import 'server-only';
import { unstable_cache } from 'next/cache';
import { SUPABASE_URL } from './env';
import { getActorList, getPlayList, getPlayMainCastSummariesBySlug, getSeriesList } from './stage-connect';

export const DIRECTORY_CACHE_TAG = 'public-directory-v1';
export const DIRECTORY_CACHE_SECONDS = 60;

// Only public anon/RLS catalogue data. Search, ordering and pagination stay per request.
// Both locales use these bilingual records; no cookies, admin state or ballots enter the cache.
export const getDirectoryActors = unstable_cache(
  () => getActorList({ includeProfiles: false }),
  ['directory-actors-v1', SUPABASE_URL],
  { revalidate: DIRECTORY_CACHE_SECONDS, tags: [DIRECTORY_CACHE_TAG] },
);
export const getDirectoryPlays = unstable_cache(
  () => getPlayList({ includeCast: false }),
  ['directory-plays-v1', SUPABASE_URL],
  { revalidate: DIRECTORY_CACHE_SECONDS, tags: [DIRECTORY_CACHE_TAG] },
);
export const getDirectorySeries = unstable_cache(
  getSeriesList,
  ['directory-series-v1', SUPABASE_URL],
  { revalidate: DIRECTORY_CACHE_SECONDS, tags: [DIRECTORY_CACHE_TAG] },
);
const getCachedCastSummaries = unstable_cache(
  getPlayMainCastSummariesBySlug,
  ['directory-visible-casts-v1', SUPABASE_URL],
  { revalidate: DIRECTORY_CACHE_SECONDS, tags: [DIRECTORY_CACHE_TAG] },
);

export function getDirectoryCastSummaries(slugs: string[]): Promise<Record<string, { ja: string | null; en: string | null }>> {
  const keys = Array.from(new Set(slugs.map(slug => slug.trim()).filter(Boolean))).sort();
  return keys.length ? getCachedCastSummaries(keys) : Promise.resolve({});
}
