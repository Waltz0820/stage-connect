import { NextRequest, NextResponse } from 'next/server';
import { searchSite } from '../../../lib/stage-connect';
import { normalizeSearchQuery } from '../../../lib/search-query';

// Public catalogue fields only, read through the existing anon/RLS client.
export async function GET(request: NextRequest) {
  const query = normalizeSearchQuery(request.nextUrl.searchParams.get('q') ?? '');
  try {
    const results = query ? await searchSite(query, 5) : { actors: [], plays: [], series: [] };
    return NextResponse.json({ query, results }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  } catch {
    return NextResponse.json({ error: 'search_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
