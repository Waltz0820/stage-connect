import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type EditorialMini = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
};

const RelatedGuides: React.FC<{ franchiseId: string }> = ({ franchiseId }) => {
  const [items, setItems] = useState<EditorialMini[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!franchiseId) return;

    const run = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('editorials')
          .select('id, slug, title, summary')
          .eq('status', 'published')
          .contains('related_franchise_ids', [franchiseId])
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(3);

        if (error) {
          console.warn('RelatedGuides fetch error', error);
          setItems([]);
          return;
        }
        setItems((data as any) ?? []);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [franchiseId]);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className="pt-10 border-t border-white/5 mt-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-lg font-bold text-white">関連ガイド</h2>
        <Link to="/guide" className="text-xs text-slate-400 hover:text-white transition-colors">
          ガイド一覧 →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((g) => (
          <Link
            key={g.id}
            to={`/guide/${g.slug}`}
            className="bg-theater-surface rounded-xl border border-white/5 p-5 hover:border-neon-cyan/30 transition-colors"
          >
            <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">{g.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-3">{g.summary}</p>
            <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              続きを読む →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedGuides;
