import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import PlayCard from './PlayCard';
import ActorAvatar from './ActorAvatar';
import Breadcrumbs from './Breadcrumbs';

import type { Actor, Gender } from '../lib/types';

type FranchiseRow = {
  id: string;
  name: string;
  slug?: string | null;
};

type PlayLike = {
  id?: string;
  slug: string;
  title: string;
  summary?: string | null;
  period?: string | null;
  venue?: string | null;
  vod?: any;
  tags?: string[] | null;
  franchise_id?: string | null;
  created_at?: string | null; // ✅ 追加（任意：同年月のタイブレーク用）
};

type TopActor = { actor: Actor; count: number };

const normalizeActorRow = (row: any): Actor => {
  return {
    slug: row.slug,
    name: row.name,
    kana: row.kana ?? '',
    profile: row.profile ?? '',
    imageUrl: row.image_url ?? row.imageUrl ?? '',
    gender: (row.gender ?? 'male') as Gender,
    sns: (row.sns as Actor['sns']) ?? {},
    featuredPlaySlugs: (row.featured_play_slugs as string[] | undefined) ?? [],
    tags: (row.tags as string[] | undefined) ?? [],
  };
};

// ✅ period から YYYYMM のソートキーを作る（雑な表記揺れに対応）
const periodSortKey = (period?: string | null) => {
  if (!period) return -1;

  // "2019年7月", "2017/12", "2017-12", "2017年12月〜" など
  const m = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    return y * 100 + mo; // YYYYMM
  }

  // 年だけ拾える場合
  const y = period.match(/(\d{4})/);
  if (y) return Number(y[1]) * 100;

  return -1;
};

const sortPlaysNewToOld = <T extends { period?: string | null; created_at?: string | null }>(list: T[]) => {
  return [...list].sort((a, b) => {
    const ak = periodSortKey(a.period);
    const bk = periodSortKey(b.period);
    if (bk !== ak) return bk - ak; // ✅ new -> old

    // 同年月が複数ある場合の安定化（created_at があれば優先）
    const ad = a.created_at ? Date.parse(a.created_at) : 0;
    const bd = b.created_at ? Date.parse(b.created_at) : 0;
    return bd - ad;
  });
};

const SeriesDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const decodedName = useMemo(() => (name ? decodeURIComponent(name) : ''), [name]);

  const [franchise, setFranchise] = useState<FranchiseRow | null>(null);
  const [plays, setPlays] = useState<PlayLike[]>([]);
  const [topActors, setTopActors] = useState<TopActor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!decodedName) return;

    const run = async () => {
      setLoading(true);

      try {
        // 1) franchise を slug or name で拾う
        const { data: fr, error: frErr } = await supabase
          .from('franchises')
          .select('id, name, slug')
          .or(`slug.eq.${decodedName},name.eq.${decodedName}`)
          .maybeSingle();

        if (frErr || !fr) {
          console.warn('SeriesDetail: franchise not found', frErr);
          setFranchise(null);
          setPlays([]);
          setTopActors([]);
          setLoading(false);
          return;
        }

        setFranchise(fr);

        // 2) plays を franchise_id で取得
        // ※ created_at が無い場合でもOK（あればタイブレークに使う）
        const { data: ps, error: psErr } = await supabase
          .from('plays')
          .select('*')
          .eq('franchise_id', fr.id);

        if (psErr || !ps) {
          console.warn('SeriesDetail: plays fetch error', psErr);
          setPlays([]);
          setTopActors([]);
          setLoading(false);
          return;
        }

        setPlays(ps as any);

        // 3) topActors：このシリーズの play_ids から casts を集計
        const playIds = (ps as any[]).map((p) => p.id).filter(Boolean);

        if (playIds.length === 0) {
          setTopActors([]);
          setLoading(false);
          return;
        }

        const { data: castRows, error: castErr } = await supabase
          .from('casts')
          .select(
            `
            play_id,
            actor:actors (
              slug,
              name,
              kana,
              profile,
              image_url,
              gender,
              sns,
              tags,
              featured_play_slugs
            )
          `
          )
          .in('play_id', playIds);

        if (castErr || !castRows) {
          console.warn('SeriesDetail: casts fetch error', castErr);
          setTopActors([]);
          setLoading(false);
          return;
        }

        // slugごとに「出演したplay_idの集合」を作る（同一作品内の重複を排除）
        const map = new Map<string, { actor: Actor; playSet: Set<string> }>();

        for (const row of castRows as any[]) {
          const raw = row.actor;
          const p = row.play_id as string | null;
          if (!raw || !p) continue;

          const a = normalizeActorRow(raw);
          const key = a.slug;

          if (!map.has(key)) map.set(key, { actor: a, playSet: new Set() });
          map.get(key)!.playSet.add(p);
        }

        const tops: TopActor[] = Array.from(map.values())
          .map((v) => ({ actor: v.actor, count: v.playSet.size }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 30);

        setTopActors(tops);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [decodedName]);

  // ✅ 表示順：new -> old（period から推定）
  const sortedPlays = useMemo(() => sortPlaysNewToOld(plays), [plays]);

  const years = useMemo(() => {
    const ys = plays
      .map((p) => {
        const m = (p.period || '').match(/(\d{4})/);
        return m ? Number(m[1]) : null;
      })
      .filter((v): v is number => v !== null);

    if (ys.length === 0) return { start: 0, end: 0 };

    return { start: Math.min(...ys), end: Math.max(...ys) };
  }, [plays]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
        <Breadcrumbs items={[{ label: 'シリーズ一覧', to: '/series' }, { label: '読み込み中…' }]} />
        <div className="mt-10 text-slate-400">読み込み中...</div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white">シリーズが見つかりませんでした</h2>
        <Link
          to="/series"
          className="mt-8 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 hover:border-neon-cyan/50 transition-colors"
        >
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <Breadcrumbs items={[{ label: 'シリーズ一覧', to: '/series' }, { label: franchise.name }]} />

      <div className="mb-16 text-center">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase">
          SERIES ARCHIVE
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          {franchise.name}
        </h1>
        <p className="text-slate-400 text-lg">
          全{plays.length}作品 ({years.start || '----'} - {years.end || '現在'})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4 lg:order-2">
          <div className="bg-theater-surface/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan"></span>
              シリーズ・レギュラー
            </h3>

            <div className="space-y-4">
              {topActors.map(({ actor, count }, index) => (
                <Link
                  key={actor.slug}
                  to={`/actors/${actor.slug}`}
                  className="flex items-center gap-3 group p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="relative">
                    <ActorAvatar imageUrl={actor.imageUrl} alt={actor.name} size="sm" />
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-cyan text-black text-[10px] font-bold flex items-center justify-center border border-white">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 group-hover:text-neon-cyan transition-colors truncate">
                      {actor.name}
                    </p>
                    <p className="text-xs text-slate-500">{count}作品出演</p>
                  </div>
                </Link>
              ))}

              {topActors.length === 0 && <p className="text-xs text-slate-500">レギュラー情報はまだありません</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 lg:order-1 space-y-12">
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-0 w-px bg-gradient-to-b from-neon-cyan/50 via-neon-cyan/20 to-transparent"></div>

            <div className="space-y-6">
              {sortedPlays.map((play) => (
                <div key={play.slug} className="relative pl-12 flex flex-col">
                  <div className="absolute left-[15px] top-0 w-2.5 h-2.5 rounded-full bg-neon-cyan shadow-[0_0_10px_#00FFFF] ring-4 ring-theater-black"></div>

                  <div className="mb-1 text-xs font-mono text-neon-cyan/80 tracking-wider">
                    {play.period || 'Year Unknown'}
                  </div>

                  <PlayCard play={play as any} className="h-auto w-full" />
                </div>
              ))}

              {sortedPlays.length === 0 && <p className="text-slate-500 italic">登録されている作品はありません。</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetail;
