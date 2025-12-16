import React, { useEffect, useState } from 'react';
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
        setItems((data as any) ?? []);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <Breadcrumbs items={[{ label: 'ガイド', to: '/guide' }]} />

      <div className="mb-10 text-center">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase">
          GUIDE
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          編集部ガイド
        </h1>
        <p className="text-slate-400 text-sm">
          初心者向けの入口・観劇の基礎・履修のコツをまとめます
        </p>
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
              <p className="text-sm text-slate-400 line-clamp-3">{g.summary}</p>
              <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                続きを読む →
              </div>
            </Link>
          ))}
          {items.length === 0 && (
            <p className="text-slate-500 italic">公開中のガイドはまだありません。</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GuideList;
