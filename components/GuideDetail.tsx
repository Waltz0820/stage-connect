import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!slug) return;

    const run = async () => {
      setLoading(true);
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
          return;
        }
        setItem(data as any);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
        <Breadcrumbs items={[{ label: 'ガイド', to: '/guide' }, { label: '読み込み中…' }]} />
        <div className="mt-10 text-slate-400">読み込み中...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
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
      <Breadcrumbs items={[{ label: 'ガイド', to: '/guide' }, { label: item.title }]} />

      <div className="mt-6 mb-8">
        <div className="text-xs font-mono text-neon-cyan/80 mb-2">
          {item.published_at ? new Date(item.published_at).toLocaleDateString('ja-JP') : ''}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          {item.title}
        </h1>
        {item.summary && <p className="text-slate-400">{item.summary}</p>}
      </div>

      {/* 本文（まずは plain text / 後でmd対応でもOK） */}
      <div className="bg-theater-surface/50 border border-white/10 rounded-xl p-6 whitespace-pre-wrap text-slate-200 leading-relaxed">
        {item.content || '本文は準備中です。'}
      </div>
    </div>
  );
};

export default GuideDetail;
