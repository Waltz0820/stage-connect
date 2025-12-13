import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';
import { supabase } from '../lib/supabase';
import { getAllFranchises, FranchiseStats } from '../lib/utils/getFranchises';
import type { Actor, Gender } from '../lib/types';

const normalizeActorRow = (row: any): Actor => ({
  slug: row.slug,
  name: row.name,
  kana: row.kana ?? '',
  profile: row.profile ?? '',
  imageUrl: row.image_url ?? row.imageUrl ?? '',
  gender: (row.gender ?? 'male') as Gender,
  sns: (row.sns as Actor['sns']) ?? {},
  featuredPlaySlugs: (row.featured_play_slugs as string[] | undefined) ?? [],
  tags: (row.tags as string[] | undefined) ?? [],
});

const SeriesList: React.FC = () => {
  const [actorsDb, setActorsDb] = useState<Actor[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActors = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('actors')
          .select('slug,name,kana,profile,image_url,gender,sns,featured_play_slugs,tags');

        if (error) {
          console.warn('SeriesList actors fetch error:', error);
          setActorsDb(null); // ローカルフォールバック
        } else {
          setActorsDb((data ?? []).map(normalizeActorRow));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActors();
  }, []);

  const franchises: FranchiseStats[] = useMemo(() => {
    // actorsDb が取れたらそれを使う。取れなければローカルにフォールバック。
    return actorsDb ? getAllFranchises(actorsDb) : getAllFranchises();
  }, [actorsDb]);

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-[1400px] animate-fade-in-up">
      <Breadcrumbs items={[{ label: 'シリーズ一覧' }]} />

      <div className="mb-12 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-bold tracking-wide text-white mb-2">
          シリーズ一覧
        </h2>
        <p className="text-sm text-slate-400 font-light tracking-wider">
          人気舞台シリーズ・フランチャイズ
        </p>
      </div>

      {loading && (
        <p className="text-slate-500 text-sm mb-6">キャスト画像を読み込み中…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {franchises.map((franchise) => (
          <Link
            key={franchise.name}
            to={`/series/${encodeURIComponent(franchise.name)}`}
            className="group block bg-theater-surface rounded-xl border border-white/5 p-8 transition-all duration-300 hover:border-neon-cyan/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-neon-cyan transition-colors duration-300">
                  {franchise.name}
                </h3>
                <span className="bg-white/5 text-slate-300 text-xs font-mono px-3 py-1 rounded-full border border-white/10">
                  {franchise.playCount}作品
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {franchise.years.start} - {franchise.years.end > 0 ? franchise.years.end : ''}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">主要キャスト</p>

                <div className="flex -space-x-2 overflow-hidden py-1">
                  {franchise.topActors.slice(0, 5).map(({ actor }) => (
                    <div key={actor.slug} className="relative inline-block w-8 h-8 rounded-full ring-2 ring-theater-surface overflow-hidden">
                      {actor.imageUrl ? (
                        <img src={actor.imageUrl} alt={actor.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                          {actor.name?.[0] ?? '?'}
                        </div>
                      )}
                    </div>
                  ))}
                  {franchise.topActors.length > 5 && (
                    <div className="relative inline-block w-8 h-8 rounded-full ring-2 ring-theater-surface bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      +{franchise.topActors.length - 5}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <span className="text-xs font-bold text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  シリーズ詳細
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SeriesList;
