import { createClient } from '@supabase/supabase-js';

type UrlItem = {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://stageconnect.jp').replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY is required');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;')
   .replace(/'/g, '&apos;');

const toIsoDate = (d?: string | null) => {
  if (!d) return undefined;
  const t = Date.parse(d);
  if (Number.isNaN(t)) return undefined;
  return new Date(t).toISOString();
};

async function fetchAll<T>(
  table: string,
  columns: string,
  filter?: (q: any) => any,
  pageSize = 1000
): Promise<T[]> {
  let from = 0;
  const out: T[] = [];

  while (true) {
    let q = supabase.from(table).select(columns).range(from, from + pageSize - 1);
    if (filter) q = filter(q);

    const { data, error } = await q;
    if (error) throw error;

    const rows = (data ?? []) as T[];
    out.push(...rows);

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return out;
}

export default async function handler(req: any, res: any) {
  try {
    const urls: UrlItem[] = [];

    // static pages
    urls.push(
      { loc: `${SITE_URL}/`, changefreq: 'daily', priority: 1.0 },
      { loc: `${SITE_URL}/plays`, changefreq: 'daily', priority: 0.8 },
      { loc: `${SITE_URL}/actors`, changefreq: 'daily', priority: 0.8 },
      { loc: `${SITE_URL}/series`, changefreq: 'weekly', priority: 0.7 },
      { loc: `${SITE_URL}/guide`, changefreq: 'weekly', priority: 0.7 }
    );

    // plays
    const plays = await fetchAll<{ slug: string; updated_at?: string | null; created_at?: string | null }>(
      'plays',
      'slug, updated_at, created_at'
    );
    for (const p of plays) {
      if (!p?.slug) continue;
      urls.push({
        loc: `${SITE_URL}/plays/${encodeURIComponent(p.slug)}`,
        lastmod: toIsoDate(p.updated_at ?? p.created_at ?? null),
        changefreq: 'weekly',
        priority: 0.7,
      });
    }

    // actors
    const actors = await fetchAll<{ slug: string; updated_at?: string | null; created_at?: string | null }>(
      'actors',
      'slug, updated_at, created_at'
    );
    for (const a of actors) {
      if (!a?.slug) continue;
      urls.push({
        loc: `${SITE_URL}/actors/${encodeURIComponent(a.slug)}`,
        lastmod: toIsoDate(a.updated_at ?? a.created_at ?? null),
        changefreq: 'weekly',
        priority: 0.6,
      });
    }

    // series (franchises)
    const franchises = await fetchAll<{ slug?: string | null; name: string; updated_at?: string | null; created_at?: string | null }>(
      'franchises',
      'slug, name, updated_at, created_at'
    );
    for (const f of franchises) {
      const key = (f.slug && f.slug.trim()) ? f.slug.trim() : f.name;
      if (!key) continue;
      urls.push({
        loc: `${SITE_URL}/series/${encodeURIComponent(key)}`,
        lastmod: toIsoDate(f.updated_at ?? f.created_at ?? null),
        changefreq: 'weekly',
        priority: 0.6,
      });
    }

    // guide (editorials) : published only
    const editorials = await fetchAll<{ slug: string; published_at?: string | null; updated_at?: string | null }>(
      'editorials',
      'slug, published_at, updated_at',
      (q) => q.eq('status', 'published')
    );
    for (const e of editorials) {
      if (!e?.slug) continue;
      urls.push({
        loc: `${SITE_URL}/guide/${encodeURIComponent(e.slug)}`,
        lastmod: toIsoDate(e.updated_at ?? e.published_at ?? null),
        changefreq: 'monthly',
        priority: 0.5,
      });
    }

    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) =>
        `  <url>\n` +
        `    <loc>${xmlEscape(u.loc)}</loc>\n` +
        (u.lastmod ? `    <lastmod>${xmlEscape(u.lastmod)}</lastmod>\n` : '') +
        (u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : '') +
        (typeof u.priority === 'number' ? `    <priority>${u.priority.toFixed(1)}</priority>\n` : '') +
        `  </url>`
      ).join('\n') +
      `\n</urlset>\n`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(body);
  } catch (err: any) {
    console.error('[sitemap] error', err);
    res.status(500).send('sitemap error');
  }
}
