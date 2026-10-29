import { revalidateTag } from 'next/cache';
import { DIRECTORY_CACHE_TAG } from '../../../../lib/directory-cache';
import { createSupabaseServerClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (status: number) => Response.json({ ok: status === 200 }, {
  status, headers: { 'Cache-Control': 'no-store' },
});

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return reply(403);
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return reply(401);
  const allowed = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '')
    .split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  if (!allowed.length) return reply(403);
  try {
    const { data, error } = await createSupabaseServerClient().auth.getUser(token);
    if (error || !data.user) return reply(401);
    if (!data.user.email || !allowed.includes(data.user.email.toLowerCase())) return reply(403);
    revalidateTag(DIRECTORY_CACHE_TAG);
    return reply(200);
  } catch { return reply(503); }
}
