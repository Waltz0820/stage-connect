// src/components/ActorDetail.tsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
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
  genre?: string | null;
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

// RPC / ネスト取得どちらでも最低限Actor型に寄せる（共演カード表示用）
const normalizeActorForCoStar = (data: any): Actor => ({
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

/**
 * ✅ モーダル表示中の “めり込み/ズレ” を潰すためのスクロールロック
 * - iOS Safari は overflow:hidden だけだとズレやすいので position:fixed 方式
 */
function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY || window.pageYOffset;
    const body = document.body;

    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevLeft = body.style.left;
    const prevRight = body.style.right;
    const prevWidth = body.style.width;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    return () => {
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.left = prevLeft;
      body.style.right = prevRight;
      body.style.width = prevWidth;

      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

/**
 * ✅ “落ちないPortal”
 * - document 未定義環境では描画しない
 * - body 直下に出す（親の transform / filter / overflow の影響を受けない）
 */
const SafePortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const ActorDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [actor, setActor] = useState<Actor | null>(null);
  const [actorId, setActorId] = useState<string | null>(null);

  const [playsDb, setPlaysDb] = useState<PlayLike[] | null>(null);

  // ✅ 共演（DB優先）用
  const [coStarsDb, setCoStarsDb] = useState<CoStarItem[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ モバイル用：共演を全員見る（モーダル）
  const [isAllCoStarsOpen, setIsAllCoStarsOpen] = useState(false);

  // ✅ モーダル中は背景スクロールを完全停止
  useBodyScrollLock(isAllCoStarsOpen);

  // ESCで閉じる（PCも快適）
  useEffect(() => {
    if (!isAllCoStarsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAllCoStarsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAllCoStarsOpen]);

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
      setCoStarsDb(null);
      setIsAllCoStarsOpen(false);

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
                genre: p.genre ?? null,
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

  // ✅ 共演ネットワーク（DB RPC優先 → ローカルgetCoStarsフォールバック）
  useEffect(() => {
    if (!actorId || !slug) return;

    let cancelled = false;

    const run = async () => {
      try {
        const { data, error } = await supabase.rpc('get_co_stars', {
          p_actor_id: actorId,
          p_limit: 20,
        });

        console.log('ActorDetail / coStars rpc:', data, error);

        if (cancelled) return;

        if (error || !data || (Array.isArray(data) && data.length === 0)) {
          setCoStarsDb(null);
          return;
        }

        const result: CoStarItem[] = (data as any[]).map((r) => ({
          actor: normalizeActorForCoStar({
            slug: r.slug,
            name: r.name,
            image_url: r.image_url,
            tags: r.tags,
          }),
          count: Number(r.common_plays ?? 0),
        }));

        setCoStarsDb(result);
      } catch (e) {
        console.warn('ActorDetail coStarsDb rpc error:', e);
        if (!cancelled) setCoStarsDb(null);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [actorId, slug]);

  // ---- ローディング表示 ----
  if (loading) {
    return (
      <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl">
        <Breadcrumbs items={[{ label: 'キャスト一覧', to: '/actors' }, { label: '読み込み中…' }]} />
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
        <p className="mt-2 text-slate-400">{error ?? 'お探しの俳優は見つかりませんでした。'}</p>
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
  const plays: PlayLike[] =
    playsDb && playsDb.length > 0 ? playsDb : slug ? (getPlaysByActorSlug(slug) as any) : [];

  const timelineGroups = groupPlaysByYear(plays as any);

  // ---- 共演ネットワーク（DBが取れたらDB、取れない/未取得ならローカル）----
  const coStars: CoStarItem[] = coStarsDb !== null ? coStarsDb : slug ? (getCoStars(slug) as any) : [];

  // ✅ 自動生成テキスト用
  const workCount = plays.length;
  const topWorks = plays
    .slice(0, 3)
    .map((p) => `『${p.title}』`)
    .join('、');
  const hasVod = plays.some((p) => p?.vod?.dmm || p?.vod?.danime || p?.vod?.unext);

  // ✅ JSON-LD（FAQPage）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${actor.name}の出演作はどこで見られますか？`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Stage Connectでは${actor.name}の出演情報を作品ごとにまとめています。各作品ページで公演データやあらすじを確認できます。`,
        },
      },
      {
        '@type': 'Question',
        name: '配信（VOD）で視聴できる作品はありますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: hasVod
            ? 'はい、いくつかの作品は動画配信サービス（VOD）で視聴可能です。各作品カードにあるリンクをご確認ください。'
            : '現在、当サイトに登録されている作品の中で、主要なVODサービスでの配信が確認されているものはありませんが、状況は変動する可能性があります。',
        },
      },
      {
        '@type': 'Question',
        name: '最新の出演情報はどこで確認できますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${actor.name}の公式SNSやオフィシャルサイトで最新情報を確認することをお勧めします。このページでも随時情報を更新していきます。`,
        },
      },
    ],
  };

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs items={[{ label: 'キャスト一覧', to: '/actors' }, { label: actor.name }]} />

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
              <ShareButton title={actor.name} text={`${actor.name}のプロフィール | Stage Connect`} className="shrink-0" />
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
        {/* Main */}
        <div className="lg:col-span-8 space-y-16">
          {/* ✅ Intro（自動生成） */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-purple"></span>
              INTRODUCTION
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed font-light">
              <span className="font-bold text-white">{actor.name}</span> の出演する2.5次元舞台・ミュージカル作品をまとめました。
              Stage Connectには現在、<span className="font-bold text-white">{workCount}作品</span>が登録されています。
              {workCount > 0 ? (
                <>
                  代表作は{topWorks}
                  {plays.length > 3 ? 'など' : ''}。
                </>
              ) : (
                <>代表作は現在準備中です。</>
              )}
              {hasVod ? '配信（VOD）で視聴できる作品がある場合は、各作品カードのリンクから確認できます。' : ''}
              最新の出演情報は随時更新します。
            </p>
          </section>

          {/* Profile */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-neon-purple rounded-full shadow-[0_0_10px_#B46CFF]"></span>
              プロフィール
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-loose font-light">
              {actor.profile || 'プロフィール情報はまだありません。'}
            </div>
          </section>

          {/* Timeline */}
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

          {/* CoStars */}
          {coStars.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1 h-6 bg-neon-cyan rounded-full shadow-[0_0_10px_#00FFFF]"></span>
                共演ネットワーク
                <span className="text-xs font-normal text-slate-500 ml-2 border border-slate-700 px-2 py-0.5 rounded">
                  共演数の多いキャスト
                </span>
              </h2>

              {/* ✅ Mobile: 横スライド + 全員を見る */}
              <div className="lg:hidden">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-theater-black/80 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-theater-black/80 to-transparent" />

                  <div className="-mx-2 px-2 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                    {coStars.slice(0, 5).map(({ actor: coStar, count }) => (
                      <Link
                        key={coStar.slug}
                        to={`/actors/${coStar.slug}`}
                        className="snap-start shrink-0 w-[280px] flex items-center gap-4 bg-theater-surface p-4 rounded-xl border border-white/5 hover:border-neon-cyan/50 hover:bg-white/5 transition-all duration-300 group"
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
                          <p className="text-xs text-slate-500 line-clamp-1">{coStar.tags?.[0] || '俳優'}</p>
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
                </div>

                {coStars.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setIsAllCoStarsOpen(true)}
                    className="mt-4 w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs font-bold hover:bg-white/10 transition-colors"
                  >
                    全員を見る（{coStars.length}）
                  </button>
                )}

                {/* ✅ モーダル（Portal） */}
                {isAllCoStarsOpen && (
                  <SafePortal>
                    <div
                      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
                      onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setIsAllCoStarsOpen(false);
                      }}
                      style={{
                        paddingTop: 'max(16px, env(safe-area-inset-top))',
                        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                      }}
                    >
                      <div className="h-full w-full flex items-center justify-center px-4">
                        <div
                          className="w-full max-w-md rounded-2xl border border-white/10 bg-theater-black/90 shadow-xl flex flex-col"
                          style={{
                            maxHeight: 'calc(100vh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
                          }}
                        >
                          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                            <p className="text-sm font-bold text-white">共演ネットワーク（全{coStars.length}）</p>
                            <button
                              type="button"
                              onClick={() => setIsAllCoStarsOpen(false)}
                              className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10"
                            >
                              閉じる
                            </button>
                          </div>

                          <div className="p-4 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' as any }}>
                            <div className="space-y-2">
                              {coStars.map(({ actor: coStar, count }) => (
                                <Link
                                  key={coStar.slug}
                                  to={`/actors/${coStar.slug}`}
                                  onClick={() => setIsAllCoStarsOpen(false)}
                                  className="flex items-center gap-3 group p-2 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                  <ActorAvatar imageUrl={coStar.imageUrl} alt={coStar.name} size="sm" />

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-bold text-slate-200 group-hover:text-neon-cyan transition-colors truncate">
                                        {coStar.name}
                                      </p>
                                      <span className="text-[10px] font-bold bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded-full border border-neon-cyan/20 whitespace-nowrap">
                                        ★ {count}作
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-1">{coStar.tags?.[0] || '俳優'}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>

                          <div className="h-2 shrink-0" />
                        </div>
                      </div>
                    </div>
                  </SafePortal>
                )}
              </div>

              {/* ✅ Desktop: そのまま（従来のカードグリッド） */}
              <div className="hidden lg:block">
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
                        <p className="text-xs text-slate-500 line-clamp-1">{coStar.tags?.[0] || '俳優'}</p>
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
              </div>
            </section>
          )}

          {/* ✅ FAQ（表示） */}
          <section className="pt-8 border-t border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-slate-500 rounded-full"></span>
              よくある質問 (FAQ)
            </h2>

            <div className="grid gap-4">
              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-purple">Q.</span>
                  {actor.name}の出演作はどこで見られますか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">
                  Stage Connectでは{actor.name}の出演情報を作品ごとにまとめています。各作品ページで公演データやあらすじを確認できます。
                </p>
              </div>

              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-purple">Q.</span>
                  配信（VOD）で視聴できる作品はありますか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">
                  {hasVod
                    ? 'はい、いくつかの作品は動画配信サービス（VOD）で視聴可能です。各作品カードにある「詳細を見る」からリンクをご確認ください。'
                    : '現在、当サイトに登録されている作品の中で、主要なVODサービスでの配信が確認されているものはありませんが、状況は変動する可能性があります。'}
                </p>
              </div>

              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-purple">Q.</span>
                  最新の出演情報はどこで確認できますか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">
                  {actor.name}の公式SNSやオフィシャルサイトで最新情報を確認することをお勧めします。このページでも随時情報を更新していきます。
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-theater-surface/50 backdrop-blur-sm rounded-xl p-8 border border-white/10 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">公式リンク</h3>

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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
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
