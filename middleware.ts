import { createClient } from '@supabase/supabase-js';

const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://stageconnect.jp').replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const OGP_BOTS = [
    'Twitterbot',
    'facebookexternalhit',
    'LinkedInBot',
    'Slackbot',
    'Discordbot',
    'LINE',
    'Pinterestbot',
    'Embedly',
];

function isOgpBot(ua: string): boolean {
    return OGP_BOTS.some((bot) => ua.includes(bot));
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildOgpHtml(params: {
    title: string;
    description: string;
    url: string;
    image?: string;
    type?: string;
}): string {
    const { title, description, url, image, type = 'article' } = params;
    const ogImage = image || `${SITE_URL}/ogp.png`;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:site_name" content="Stage Connect">
  <meta property="og:locale" content="ja_JP">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
</head>
<body></body>
</html>`;
}

type RouteMatch =
    | { type: 'play'; slug: string }
    | { type: 'actor'; slug: string }
    | { type: 'series'; slug: string }
    | null;

function matchRoute(pathname: string): RouteMatch {
    const playMatch = pathname.match(/^\/plays\/([^/]+)$/);
    if (playMatch) return { type: 'play', slug: decodeURIComponent(playMatch[1]) };

    const actorMatch = pathname.match(/^\/actors\/([^/]+)$/);
    if (actorMatch) return { type: 'actor', slug: decodeURIComponent(actorMatch[1]) };

    const seriesMatch = pathname.match(/^\/series\/([^/]+)$/);
    if (seriesMatch) return { type: 'series', slug: decodeURIComponent(seriesMatch[1]) };

    return null;
}

export const config = {
    matcher: ['/plays/:slug*', '/actors/:slug*', '/series/:slug*'],
};

export default async function middleware(req: any) {
    const ua = req.headers.get('user-agent') || '';

    if (!isOgpBot(ua)) return;

    const url = new URL(req.url);
    const route = matchRoute(url.pathname);
    if (!route) return;

    if (!SUPABASE_URL || !SUPABASE_KEY) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
        let title = 'Stage Connect';
        let description = '2.5次元舞台とキャストをつなぐデジタルアーカイブ';
        let image: string | undefined;

        if (route.type === 'play') {
            const { data } = await supabase
                .from('plays')
                .select('title, summary')
                .eq('slug', route.slug)
                .maybeSingle();

            if (data) {
                title = `${data.title}｜キャスト・配信（VOD）・公演情報 - Stage Connect`;
                description = data.summary
                    ? String(data.summary).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150)
                    : `舞台『${data.title}』の配信情報（VOD）と公演データをまとめました。`;
            }
        } else if (route.type === 'actor') {
            const { data } = await supabase
                .from('actors')
                .select('name, profile, image_url')
                .eq('slug', route.slug)
                .maybeSingle();

            if (data) {
                title = `${data.name}｜出演作・配信（VOD）情報 - Stage Connect`;
                description = data.profile
                    ? String(data.profile).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150)
                    : `${data.name}の出演する2.5次元舞台・ミュージカル作品をまとめました。`;
                if (data.image_url) image = data.image_url;
            }
        } else if (route.type === 'series') {
            const { data } = await supabase
                .from('franchises')
                .select('name, origin_note')
                .eq('slug', route.slug)
                .maybeSingle();

            if (data) {
                title = `${data.name}｜シリーズ作品一覧・年表 - Stage Connect`;
                description = data.origin_note
                    ? String(data.origin_note).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150)
                    : `${data.name}シリーズの舞台作品一覧、年表、主要キャスト情報をまとめました。`;
            }
        }

        const pageUrl = `${SITE_URL}${url.pathname}`;
        const html = buildOgpHtml({ title, description, url: pageUrl, image });

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (err) {
        console.error('[ogp-middleware] error:', err);
        return; // fallback to SPA
    }
}
