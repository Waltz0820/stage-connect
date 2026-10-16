// Node-only: never import this module into client components.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

export const VOTER_COOKIE = 'sc_oshi_voter';
export const VOTER_MAX_AGE = 60 * 60 * 24 * 365;
const hmac = (secret, text) => createHmac('sha256', secret).update(text).digest('hex');
export function issueVoterToken(secret, now = Date.now()) {
  const payload = `v1.${randomBytes(24).toString('hex')}.${Math.floor(now / 1000)}`;
  return `${payload}.${hmac(secret, `cookie:${payload}`)}`;
}
export function verifyVoterToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || !/^v1\.[a-f0-9]{48}\.\d{10}\.[a-f0-9]{64}$/.test(token)) return null;
  const [version, id, issued, signature] = token.split('.');
  const age = Math.floor(now / 1000) - Number(issued);
  if (age < -60 || age > VOTER_MAX_AGE) return null;
  const expected = hmac(secret, `cookie:${version}.${id}.${issued}`);
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex')) ? hmac(secret, `voter:${id}`) : null;
}
// Only Vercel's overwritten header is trusted in production. Local headers cannot choose identities.
export function networkHash(headers, secret, { vercel = process.env.VERCEL === '1', production = process.env.NODE_ENV === 'production', now = Date.now() } = {}) {
  let ip = vercel ? headers.get('x-vercel-forwarded-for')?.trim() : production ? null : '127.0.0.1';
  if (!ip || !isIP(ip)) return null;
  if (isIP(ip) === 6) {
    // IPv6 privacy address rotation within a /64 should not evade the rate limit.
    const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
    const [left, right = ''] = canonical.split('::');
    const a = left ? left.split(':') : [];
    const b = right ? right.split(':') : [];
    const parts = canonical.includes('::') ? [...a, ...Array(8 - a.length - b.length).fill('0'), ...b] : a;
    if (parts.slice(0,5).every((part) => parseInt(part,16) === 0) && parseInt(parts[5],16) === 65535) {
      const tail = parts.slice(6).map((part) => parseInt(part,16));
      ip = [tail[0] >> 8, tail[0] & 255, tail[1] >> 8, tail[1] & 255].join('.');
    } else ip = parts.slice(0, 4).map((part) => part.padStart(4, '0')).join(':');
  }
  return hmac(secret, `network:${new Date(now).toISOString().slice(0, 10)}:${ip}`);
}
export function sameOriginVote(request) {
  const origin = request.headers.get('origin');
  // Next's dev server can normalize request.url to localhost although the browser uses 127.0.0.1.
  // Host is the actual HTTP authority; never use an arbitrary X-Forwarded-Host here.
  const target = new URL(request.url);
  const host = request.headers.get('host');
  if (host) target.host = host;
  return origin === target.origin
    && !['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') ?? '');
}
