// src/components/ActorDetail.tsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Actor, Gender } from '../lib/types';

import { getPlaysByActorSlug } from '../lib/utils/getPlaysByActorSlug'; // フォールバック用
import { groupPlaysByYear } from '../lib/utils/groupPlaysByYear';
import { getCoStars } from '../lib/utils/getCoStars';
import TimelineSection from './TimelineSection';
import TagBadge from './TagBadge';
import ActorAvatar from './ActorAvatar';
import FavoriteButton from './FavoriteButton';
import ShareButton from './ShareButton';
import Breadcrumbs from './Breadcrumbs';

type PlayLike = {
  id?: string;
  slug: string;
  title: string;
  summary?: string | null;
  period?: string | null;
  venue?: string | null;
  vod?: any;
  tags?: string[] | null;
  franchise?: string | null;
  genre?: string | null; // ✅ 追加
};

type CoStarItem = { actor: Actor; count: number };

const normalizeActorRow = (data: any): Actor => ({
  slug: data.slug,
  name: data.name,
  kana: data.kana ?? '',
  profile: data.profile ?? '',
  imageUrl: data.image_url ?? '',
  gender: (data.gender ?? 'male') as Gender,
  sns: (data.sns as Actor['sns']) ?? {},
  featuredPlaySlugs: (data.featured_play_slugs as string[] | undefined) ?? [],
  tags: (data.tags as string[] | undefined) ?? [],
});

const normalizeActorNested = (data: any): Actor => ({
  slug: data.slug,
  name: data.name,
  kana: data.kana ?? '',
  profile: data.profile ?? '',
  imageUrl: data.image_url ?? data.imageUrl ?? '',
  gender: (data.gender ?? 'male') as Gender,
  sns: (data.sns as Actor['sns']) ?? {},
  featuredPlaySlugs: (data.featured_play_slugs as string[] | undefined) ?? [],
  tags: (data.tags as string[] | undefined) ?? [],
});

const ActorDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [actor, setActor] = useState<Actor | null>(null);
  const [actorId, setActorId] = useState<string | null>(null);

  const [playsDb, setPlaysDb] = useState<PlayLike[] | null>(null);

  // ✅ 共演（DB優先）用
  const [coStarsDb, setCoStarsDb] = useState<CoStarItem[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Supabase から俳優1件＋出演作品を取得 ----
  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setActor(null);
      setActorId(null);
      setPlaysDb(null);
      setCoStarsDb(null); // ✅ slug切替時に共演もリセット

      try {
        // 1) actor
        const { data, error } = await supabase
          .from('actors')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        console.log('ActorDetail / actor:', data, error);

        if (cancelled) return;

        if (error) {
          console.error('ActorDetail fetch error', error);
          setError('俳優情報の取得に失敗しました。');
          return;
        }
        if (!data) {
          setError('該当する俳優が見つかりませんでした。');
          return;
        }

        setActor(normalizeActorRow(data));
        setActorId(data.id ?? null);

        // 2) plays (casts -> plays)
        if (data.id) {
          const { data: castRows, error: castErr } = await supabase
            .from('casts')
            .select(
              `
              play:plays (
                id,
                slug,
                title,
                summary,
                period,
                venue,
                vod,
                tags,
                genre,
                franchise:franchises(name)
              )
            `
            )
            .eq('actor_id', data.id);

          console.log('ActorDetail / casts->plays:', castRows, castErr);

          if (cancelled) return;

          if (!castErr && castRows && castRows.length > 0) {
            const uniq = new Map<string, PlayLike>();

            for (const row of castRows as any[]) {
              const p = row.play;
              if (!p?.slug) continue;

              const mapped: PlayLike = {
                id: p.id,
                slug: p.slug,
                title: p.title,
                summary: p.summary ?? null,
                period: p.period ?? null,
                venue: p.venue ?? null,
                vod: p.vod ?? null,
                tags: p.tags ?? null,
                franchise: p.franchise?.name ?? null,
                genre: p.genre ?? null, // ✅ 追加
              };

              uniq.set(mapped.slug, mapped);
            }

            setPlaysDb(Array.from(uniq.values()));
          } else {
            // casts がまだ無い or 取得失敗 → 空で保持（後でフォールバック）
            setPlaysDb([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ✅ 共演ネットワーク（DB優先 → ローカルgetCoStarsフォールバック）
  useEffect(() => {
    if (!actorId) return;

    let cancelled = false;

    const run = async () => {
      try {
        // 1) 自分の出演 play_id 一覧
        const { data: myCasts, error: myErr } = await supabase
          .from('casts')
          .select('play_id')
          .eq('actor_id', actorId);

        if (cancelled) return;

        if (myErr || !myCasts || myCasts.length === 0) {
          // DBで取れない → 空扱い（この場合は後段の fallback を使いたいなら null にしてもOK）
          setCoStarsDb([]);
          return;
        }

        const playIds = Array.from(
          new Set((myCasts as any[]).map((r) => r.play_id).filter(Boolean))
        );

        if (playIds.length === 0) {
          setCoStarsDb([]);
          return;
        }

        // 2) 同一playのcastsを引いて、actorsをネスト取得（自分以外）
        const { data: rows, error: rowsErr } = await supabase
          .from('casts')
          .select(
            `
            play_id,
            actor_id,
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
          .in('play_id', playIds)
          .neq('actor_id', actorId);

        if (cancelled) return;

        if (rowsErr || !rows) {
          setCoStarsDb([]);
          return;
        }

        // 3) 集計（共演者ごとの作品数）
        const map = new Map<string, { actor: Actor; playSet: Set<string> }>();

        for (const row of rows as any[]) {
          const a = row.actor;
          const p = row.play_id as string | null;
          if (!a?.slug || !p) continue;

          const norm = normalizeActorNested(a);

          if (!map.has(norm.slug)) map.set(norm.slug, { actor: norm, playSet: new Set() });
          map.get(norm.slug)!.playSet.add(p);
        }

        const result: CoStarItem[] = Array.from(map.values())
          .map((v) => ({ actor: v.actor, count: v.playSet.size }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20);

        setCoStarsDb(result);
      } catch (e) {
        console.warn('ActorDetail coStarsDb error:', e);
        if (!cancelled) setCoStarsDb([]);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [actorId]);

  // ---- ローディング表示 ----
  if (loading) {
    return (
      <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl">
        <Breadcrumbs
          items={[
            { label: 'キャスト一覧', to: '/actors' },
            { label: '読み込み中…' },
          ]}
        />
        <div className="mt-10 rounded-2xl bg-theater-surface border border-white/10 p-8 animate-pulse">
          <div className="h-6 w-40 bg-white/10 rounded mb-4" />
          <div className="h-4 w-24 bg-white/10 rounded mb-6" />
          <div className="h-24 w-full bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  // ---- エラー or 俳優なし ----
  if (error || !actor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white">俳優が見つかりませんでした</h2>
        <p className="mt-2 text-slate-400">
          {error ?? 'お探しの俳優は見つかりませんでした。'}
        </p>
        <Link
          to="/actors"
          className="mt-8 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 hover:border-neon-purple/50 transition-colors"
        >
          一覧に戻る
        </Link>
      </div>
    );
  }

  // ---- 出演作品（DB優先 → ダメならローカルフォールバック）----
  const plays: any[] =
    playsDb && playsDb.length > 0
      ? (playsDb as any[])
      : slug
      ? (getPlaysByActorSlug(slug) as any[])
      : [];

  const timelineGroups = groupPlaysByYear(plays as any);

  // ---- 共演ネットワーク（DBが取れたらDB、取れない/未取得ならローカル）----
  // coStarsDb: null = まだDB取得してない/初期, [] = DB上で共演がない(もしくは取得不可)
  const coStars: CoStarItem[] =
    coStarsDb !== null ? coStarsDb : slug ? (getCoStars(slug) as any) : [];

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <Breadcrumbs
        items={[
          { label: 'キャスト一覧', to: '/actors' },
          { label: actor.name },
        ]}
      />

      {/* Header Card Section */}
      <div className="mb-12">
        <div className="bg-theater-surface rounded-2xl border border-white/5 p-8 md:p-10 shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-sm relative overflow-hidden flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-10 text-center md:text-left">
          <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-neon-purple/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="shrink-0 relative z-10">
            <ActorAvatar imageUrl={actor.imageUrl} alt={actor.name} size="lg" />
          </div>

          <div className="flex flex-col gap-3 z-10 flex-1 min-w-0 items-center md:items-start">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md mb-2">
                  {actor.name}
                </h1>
                {actor.kana && (
                  <span className="text-sm md:text-base text-neon-purple font-bold tracking-widest uppercase block">
                    {actor.kana}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1 mb-2">
              <FavoriteButton slug={actor.slug} type="actor" size="lg" className="shrink-0" />
              <ShareButton
                title={actor.name}
                text={`${actor.name}のプロフィール | Stage Connect`}
                className="shrink-0"
              />
            </div>

            {actor.tags && actor.tags.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                {actor.tags.map((tag) => (
                  <TagBadge key={tag}>{tag}</TagBadge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-8 space-y-16">
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-neon-purple rounded-full shadow-[0_0_10px_#B46CFF]"></span>
              プロフィール
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-loose font-light">
              {actor.profile || 'プロフィール情報はまだありません。'}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-1 h-6 bg-neon-pink rounded-full shadow-[0_0_10px_#E944A6]"></span>
              出演作品タイムライン
            </h2>

            {plays.length > 0 ? (
              <TimelineSection groups={timelineGroups} />
            ) : (
              <p className="text-slate-500 italic py-4">登録されている出演作品はありません。</p>
            )}
          </section>

          {coStars.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <span className="w-1 h-6 bg-neon-cyan rounded-full shadow-[0_0_10px_#00FFFF]"></span>
                共演ネットワーク
                <span className="text-xs font-normal text-slate-500 ml-2 border border-slate-700 px-2 py-0.5 rounded">
                  共演数の多いキャスト
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coStars.map(({ actor: coStar, count }) => (
                  <Link
                    key={coStar.slug}
                    to={`/actors/${coStar.slug}`}
                    className="flex items-center gap-4 bg-theater-surface p-4 rounded-xl border border-white/5 hover:border-neon-cyan/50 hover:bg-white/5 transition-all duration-300 group"
                  >
                    <ActorAvatar imageUrl={coStar.imageUrl} alt={coStar.name} size="sm" />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-white group-hover:text-neon-cyan transition-colors truncate">
                          {coStar.name}
                        </h3>
                        <span className="text-[10px] font-bold bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded-full border border-neon-cyan/20 whitespace-nowrap ml-2">
                          ★ {count}作
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {coStar.tags?.[0] || '俳優'}
                      </p>
                    </div>

                    <svg
                      className="w-4 h-4 text-slate-600 group-hover:text-neon-cyan transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-theater-surface/50 backdrop-blur-sm rounded-xl p-8 border border-white/10 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
              公式リンク
            </h3>

            {actor.sns ? (
              <ul className="space-y-4">
                {actor.sns.official && (
                  <li>
                    <a
                      href={actor.sns.official}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm font-bold text-slate-300 hover:text-white transition-colors group"
                    >
                      <span className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mr-4 group-hover:border-neon-purple/50 group-hover:shadow-[0_0_10px_rgba(180,108,255,0.3)] transition-all">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </span>
                      公式サイト
                    </a>
                  </li>
                )}

                {actor.sns.x && (
                  <li>
                    <a
                      href={actor.sns.x}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm font-bold text-slate-300 hover:text-white transition-colors group"
                    >
                      <span className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mr-4 group-hover:border-neon-purple/50 group-hover:shadow-[0_0_10px_rgba(180,108,255,0.3)] transition-all">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-neon-purple" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </span>
                      X (Twitter)
                    </a>
                  </li>
                )}

                {actor.sns.instagram && (
                  <li>
                    <a
                      href={actor.sns.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm font-bold text-slate-300 hover:text-white transition-colors group"
                    >
                      <span className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mr-4 group-hover:border-neon-purple/50 group-hover:shadow-[0_0_10px_rgba(180,108,255,0.3)] transition-all">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-neon-purple" fill="currentColor" viewBox="0 0 24 24">
                          <path
                            fillRule="evenodd"
                            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.416 2.52c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">リンク情報はありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorDetail;
