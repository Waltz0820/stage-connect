// src/components/GuideDetail.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Breadcrumbs from './Breadcrumbs';

type Editorial = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  published_at?: string | null;
};

const GuideDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<Editorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // -------------------------
  // ✅ SEO Helpers
  // -------------------------
  const toPlainText = (s: any) => {
    const str = String(s ?? '');
    return str
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();
  };

  const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + '…');

  const siteUrl = useMemo(() => {
    const envUrl = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
    if (envUrl) return envUrl.replace(/\/$/, '');
    if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
    return '';
  }, []);

  const canonicalUrl = useMemo(() => {
    if (!item?.slug || !siteUrl) return '';
    return `${siteUrl}/guide/${encodeURIComponent(item.slug)}`;
  }, [item?.slug, siteUrl]);

  const seoTitle = useMemo(() => {
    if (!item) return 'ガイド | Stage Connect';
    return `${item.title} | Stage Connect`;
  }, [item]);

  const seoDescription = useMemo(() => {
    if (!item) return '観劇初心者向けの入口・観劇の基礎・履修のコツをまとめるStage Connectの編集部ガイド。';

    const summary = item.summary ? toPlainText(item.summary) : '';
    const body = item.content ? toPlainText(item.content) : '';
    const base = summary || body || `『${item.title}』のガイド記事です。`;
    return truncate(base, 155);
  }, [item]);

  const ogImage = useMemo(() => {
    const envOg = (import.meta as any)?.env?.VITE_OG_IMAGE as string | undefined;
    if (envOg) return envOg;
    return '';
  }, []);

  // ✅ JSON-LD（Article）
  const jsonLd = useMemo(() => {
    if (!item || !siteUrl) return null;

    const published = item.published_at ? new Date(item.published_at).toISOString() : undefined;

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: item.title,
      description: seoDescription,
      datePublished: published,
      dateModified: published,
      mainEntityOfPage: canonicalUrl || `${siteUrl}/guide/${encodeURIComponent(item.slug)}`,
      author: {
        '@type': 'Organization',
        name: 'Stage Connect',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Stage Connect',
      },
    };
  }, [item, siteUrl, canonicalUrl, seoDescription]);

  // -------------------------
  // ✅ Data fetch
  // -------------------------
  useEffect(() => {
    if (!slug) return;

    const run = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const { data, error } = await supabase
          .from('editorials')
          .select('id, slug, title, summary, content, published_at')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();

        if (error || !data) {
          console.warn('GuideDetail fetch error', error);
          setItem(null);
          setNotFound(true);
          return;
        }

        setItem(data as any);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [slug]);

  // -------------------------
  // ✅ Early returns
  // -------------------------
  if (loading) {
    return (
      <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
        <title>読み込み中... | Stage Connect</title>
        <meta name="robots" content="noindex,nofollow" />

        <Breadcrumbs items={[{ label: 'ガイド', to: '/guide' }, { label: '読み込み中…' }]} />
        <div className="mt-10 text-slate-400">読み込み中...</div>
      </div>
    );
  }

  if (!item || notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <title>ガイドが見つかりません | Stage Connect</title>
        <meta name="robots" content="noindex,nofollow" />

        <h2 className="text-2xl font-bold text-white">ガイドが見つかりませんでした</h2>
        <Link
          to="/guide"
          className="mt-8 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 transition-colors"
        >
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-3xl animate-fade-in-up">
      {/* ✅ SEO head（React 19 native） */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* OG / Twitter（最低限） */}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="Stage Connect" />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* ✅ 構造化データ */}
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <Breadcrumbs items={[{ label: 'ガイド', to: '/guide' }, { label: item.title }]} />

      <div className="mt-6 mb-8">
        <div className="text-xs font-mono text-neon-cyan/80 mb-2">
          {item.published_at ? new Date(item.published_at).toLocaleDateString('ja-JP') : ''}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{item.title}</h1>
        {item.summary && <p className="text-slate-400">{item.summary}</p>}
      </div>

      {/* 本文（plain text / 後でmd対応でもOK） */}
      <div className="bg-theater-surface/50 border border-white/10 rounded-xl p-6 whitespace-pre-wrap text-slate-200 leading-relaxed">
        {item.content || '本文は準備中です。'}
      </div>
    </div>
  );
};

export default GuideDetail;
