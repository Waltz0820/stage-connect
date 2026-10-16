import { NextRequest, NextResponse } from 'next/server';
import { votingConfig } from '../../../../../lib/oshi-server';
import { isPlayId, validOshiSelection, summarizeOshiResults } from '../../../../../lib/oshi-points.mjs';
import { issueVoterToken, verifyVoterToken, networkHash, sameOriginVote, VOTER_COOKIE, VOTER_MAX_AGE } from '../../../../../lib/oshi-security.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: {
  'Cache-Control': 'private, no-store', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff',
} });
const unavailable = () => json({ error: 'unavailable' }, 503);

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isPlayId(id)) return json({ error: 'invalid_play' }, 400);
  const config = votingConfig();
  if (!config) return unavailable();
  const { client, secret } = config;
  const token = request.cookies.get(VOTER_COOKIE)?.value;
  const voter = verifyVoterToken(token, secret);
  const [play, aggregate, ballot] = await Promise.all([
    client.from('plays').select('id').eq('id', id).maybeSingle(),
    client.rpc('get_oshi_results', { p_play_id: id }),
    voter ? client.from('oshi_ballots').select('point_ids').eq('play_id', id).eq('voter_hash', voter).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (play.error || aggregate.error || ballot.error) return unavailable();
  if (!play.data) return json({ error: 'not_found' }, 404);
  const response = json({ ...summarizeOshiResults(aggregate.data), selection: ballot.data?.point_ids ?? [] });
  if (!voter) response.cookies.set(VOTER_COOKIE, issueVoterToken(secret), {
    httpOnly: true, sameSite: 'lax', secure: new URL(request.url).protocol === 'https:',
    path: '/', maxAge: VOTER_MAX_AGE,
  });
  return response;
}

export async function POST(request: NextRequest, { params }: Context) {
  if (!sameOriginVote(request)) return json({ error: 'origin' }, 403);
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json({ error: 'invalid_body' }, 415);
  const { id } = await params;
  if (!isPlayId(id)) return json({ error: 'invalid_play' }, 400);
  // Bound streamed bodies too; Content-Length alone is caller-controlled.
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'invalid_body' }, 400);
  let body = '';
  let size = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1024) { await reader.cancel(); return json({ error: 'invalid_body' }, 413); }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  let points: unknown;
  try { points = JSON.parse(body)?.points; } catch { return json({ error: 'invalid_ballot' }, 400); }
  if (!validOshiSelection(points)) return json({ error: 'invalid_ballot' }, 400);
  const config = votingConfig();
  if (!config) return unavailable();
  const { client, secret } = config;
  const voter = verifyVoterToken(request.cookies.get(VOTER_COOKIE)?.value, secret);
  if (!voter) return json({ error: 'identity_required' }, 409);
  const network = networkHash(request.headers, secret);
  if (!network) return unavailable();
  const { error } = await client.rpc('submit_oshi_ballot', {
    p_play_id: id, p_voter_hash: voter, p_network_hash: network, p_points: points,
  });
  if (error) {
    if (error.message.includes('vote_rate_limited')) {
      const response = json({ error: 'rate_limited' }, 429);
      response.headers.set('Retry-After', '3600');
      return response;
    }
    if (error.code === 'P0002') return json({ error: 'not_found' }, 404);
    if (error.code === '22023') return json({ error: 'invalid_ballot' }, 400);
    return unavailable();
  }
  // A successful transaction is acknowledged even if the following read is temporarily unavailable.
  const { data, error: readError } = await client.rpc('get_oshi_results', { p_play_id: id });
  return json({ saved: true, selection: points, results: readError ? null : summarizeOshiResults(data) });
}
