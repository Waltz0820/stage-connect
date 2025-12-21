// src/components/GuideList.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';

type Editorial = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  published_at?: string | null;
};

const GuideList: React.FC = () => {
  const [items, setItems] = useState<Editorial[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!siteUrl) return '';
    return `${siteUrl}/guide`;
  }, [siteUrl]);

  const seoTitle = useMemo(() => {
    return '編集部ガイド | Stage Connect';
  }, []);

  const seoDescription = useMemo(() => {
    // 一覧ページなので固定説明でOK（itemsの内容に依存しない）
    const base =
      '観劇初心者向けの入口として、舞台の基礎知識・観劇のコツ・履修のヒントを編集部がまとめたガイド一覧です。';
    const extra =
      items.length > 0 ? `公開中：${items.length}本。気になる記事から読めます。` : '現在は準備中です。';
    return truncate(`${base}${extra}`, 155);
  }, [items.length]);

  const ogImage = useMemo(() => {
    const envOg = (import.meta as any)?.env?.VITE_OG_IMAGE as string | undefined;
    if (envOg) return envOg;
    return '';
  }, []);

  // ✅ JSON-LD（ItemList）
  const jsonLd = useMemo(() => {
    if (!siteUrl) return null;

    const listItems = items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${siteUrl}/guide/${encodeURIComponent(it.slug)}`,
      name: it.title,
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: '編集部ガイド',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: items.length,
      itemListElement: listItems,
    };
  }, [items, siteUrl]);

  // -------------------------
  // ✅ Data fetch
  // -------------------------
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('editorials')
          .select('id, slug, title, summary, published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false, nullsFirst: false });

        if (error) {
          console.warn('GuideList fetch error', error);
          setItems([]);
          return;
        }

        // summaryがnullでも表示は崩さない（後段でtoPlainText）
        setItems(((data as any) ?? []) as Editorial[]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      {/* ✅ SEO head（React 19 native） */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* OG / Twitter（最低限） */}
      <meta property="og:type" content="website" />
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

      <Breadcrumbs items={[{ label: 'ガイド', to: '/guide' }]} />

      <div className="mb-10 text-center">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase">
          GUIDE
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">編集部ガイド</h1>
        <p className="text-slate-400 text-sm">初心者向けの入口・観劇の基礎・履修のコツをまとめます</p>
      </div>

      {loading ? (
        <div className="text-slate-400">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((g) => (
            <Link
              key={g.id}
              to={`/guide/${g.slug}`}
              className="bg-theater-surface rounded-xl border border-white/5 p-6 hover:border-neon-cyan/30 transition-colors"
            >
              <div className="text-xs font-mono text-neon-cyan/80 mb-2">
                {g.published_at ? new Date(g.published_at).toLocaleDateString('ja-JP') : ''}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{g.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-3">{truncate(toPlainText(g.summary), 140)}</p>
              <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">続きを読む →</div>
            </Link>
          ))}
          {items.length === 0 && <p className="text-slate-500 italic">公開中のガイドはまだありません。</p>}
        </div>
      )}
    </div>
  );
};

export default GuideList;
