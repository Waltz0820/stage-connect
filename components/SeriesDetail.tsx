// src/components/SeriesDetail.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';

import PlayCard from './PlayCard';
import ActorAvatar from './ActorAvatar';
import Breadcrumbs from './Breadcrumbs';

import type { Actor, Gender } from '../lib/types';

type FranchiseRow = {
  id: string;
  name: string;
  slug?: string | null;

  // ✅ 管理画面から入力する用
  intro?: string | null; // 短文（上部の追加説明）
  description?: string | null; // 長文（折りたたみ）
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

const SITE_NAME = 'Stage Connect';

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

// -------------------------
// ✅ Text helpers（SEO用）
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

const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, Math.max(0, n - 1)) + '…');

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

      // 復帰
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

/**
 * ✅ Portal（document.body直下）に出す
 * スタッキングコンテキストに閉じ込められて固定CTAに負ける問題を根本回避
 */
const ModalPortal: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => {
  if (!open) return null;
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const SeriesDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const decodedName = useMemo(() => (name ? decodeURIComponent(name) : ''), [name]);

  const [franchise, setFranchise] = useState<FranchiseRow | null>(null);
  const [plays, setPlays] = useState<PlayLike[]>([]);
  const [topActors, setTopActors] = useState<TopActor[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 長文折りたたみ（description用）
  const [isIntroOpen, setIsIntroOpen] = useState(false);

  // ✅ モバイル用：全員を見る（モーダル）
  const [isAllActorsOpen, setIsAllActorsOpen] = useState(false);

  // ✅ モーダル中は背景スクロールを完全停止（めり込み対策）
  useBodyScrollLock(isAllActorsOpen);

  // -------------------------
  // ✅ Site URL（canonical / OG 用）
  // -------------------------
  const siteUrl = useMemo(() => {
    const envUrl = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
    if (envUrl) return envUrl.replace(/\/$/, '');
    if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
    return '';
  }, []);

  // ESCで閉じる（PCも快適）
  useEffect(() => {
    if (!isAllActorsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAllActorsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAllActorsOpen]);

  useEffect(() => {
    if (!decodedName) return;

    const run = async () => {
      setLoading(true);

      try {
        // 1) franchise を slug or name で拾う
        const { data: fr, error: frErr } = await supabase
          .from('franchises')
          .select('id, name, slug, intro, description')
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

        setFranchise(fr as any);

        // 2) plays を franchise_id で取得
        const { data: ps, error: psErr } = await supabase.from('plays').select('*').eq('franchise_id', (fr as any).id);

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

        // ✅ シリーズを変えたときは折りたたみを閉じる
        setIsIntroOpen(false);

        // ✅ シリーズを変えたときはモーダルも閉じる
        setIsAllActorsOpen(false);
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

  const hasVod = useMemo(() => plays.some((p) => p.vod?.dmm || p.vod?.danime || p.vod?.unext), [plays]);

  const startYear = years.start || 0;
  const endYear = years.end && years.end > 0 ? years.end : 0;
  const endYearLabel = endYear > 0 ? `${endYear}` : '現在';

  // ✅ 自動要約：常に表示する“固定パート”
  const autoIntro = useMemo(() => {
    const nm = franchise?.name ?? '';
    return `${nm}シリーズの舞台作品を年表形式でまとめました。全${plays.length}作品（${startYear || '----'}-${endYearLabel}）を掲載しています。${
      hasVod ? '配信（VOD）がある作品はカード内から確認できます。' : ''
    }`;
  }, [franchise?.name, plays.length, startYear, endYearLabel, hasVod]);

  // ✅ 手動追加（短文）※自動要約の下に“積む”
  const manualIntro = useMemo(() => {
    const t = franchise?.intro?.trim();
    return t ? t : '';
  }, [franchise?.intro]);

  // ✅ 長文（折りたたみ）
  const longText = useMemo(() => {
    const t = franchise?.description?.trim();
    return t ? t : '';
  }, [franchise?.description]);

  // -------------------------
  // ✅ SEO
  // -------------------------
  const canonicalUrl = useMemo(() => {
    if (!siteUrl || !franchise?.name) return '';
    return `${siteUrl}/series/${encodeURIComponent(franchise.name)}`;
  }, [siteUrl, franchise?.name]);

  const seoTitle = useMemo(() => {
    if (!franchise) return `${SITE_NAME}`;
    return `${franchise.name}｜シリーズ作品一覧・年表 - ${SITE_NAME}`;
  }, [franchise]);

  const seoDescription = useMemo(() => {
    if (!franchise) return '人気舞台シリーズの作品を年表形式でまとめるStage Connect。';
    const nm = franchise.name;

    const base = `${nm}シリーズの舞台作品一覧。全${plays.length}作品（${startYear || '----'}-${endYearLabel}）を年表形式で掲載。主要キャスト（シリーズ・レギュラー）や配信（VOD）情報も確認できます。`;

    const extra = manualIntro ? ` ${toPlainText(manualIntro)}` : '';
    const composed = `${base}${extra}`;

    return truncate(toPlainText(composed), 155);
  }, [franchise, plays.length, startYear, endYearLabel, manualIntro]);

  const ogImage = useMemo(() => {
    const envOg = (import.meta as any)?.env?.VITE_OG_IMAGE as string | undefined;
    if (envOg) return envOg;
    return '';
  }, []);

  // JSON-LD（FAQPage）
  const jsonLdFaq = useMemo(() => {
    if (!franchise) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `${franchise.name}シリーズの舞台作品は何作品ありますか？`,
          acceptedAnswer: { '@type': 'Answer', text: `現在、${plays.length}作品が登録されています。` },
        },
        {
          '@type': 'Question',
          name: 'どの順番で見ればいいですか？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `基本的には公開年順（${startYear || '----'}年〜）に見ることをお勧めします。このページでは時系列順に作品を掲載しています。`,
          },
        },
        {
          '@type': 'Question',
          name: '配信（VOD）で見られる作品はありますか？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: hasVod
              ? 'はい、シリーズ作品の多くは動画配信サービスで視聴可能です。各作品カードに配信リンクがあるか確認してください。'
              : '作品によっては配信が行われていないものもあります。詳細は各作品ページをご確認ください。',
          },
        },
      ],
    };
  }, [franchise, plays.length, startYear, hasVod]);

  // JSON-LD（BreadcrumbList）
  const jsonLdBreadcrumbs = useMemo(() => {
    if (!canonicalUrl || !franchise?.name) return null;

    const list = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'シリーズ一覧',
        item: `${siteUrl}/series`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: franchise.name,
        item: canonicalUrl,
      },
    ];

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: list,
    };
  }, [canonicalUrl, franchise?.name, siteUrl]);

  // -------------------------
  // ✅ Early returns
  // -------------------------
  if (loading) {
    return (
      <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
        {/* ✅ SEO（loading時は noindex 推奨） */}
        <title>読み込み中… | {SITE_NAME}</title>
        <meta name="robots" content="noindex,nofollow" />

        <Breadcrumbs items={[{ label: 'シリーズ一覧', to: '/series' }, { label: '読み込み中…' }]} />
        <div className="mt-10 text-slate-400">読み込み中...</div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        {/* ✅ SEO（404相当） */}
        <title>シリーズが見つかりません | {SITE_NAME}</title>
        <meta name="robots" content="noindex,nofollow" />

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
      {/* ✅ SEO head（React 19 native） */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="robots" content="index,follow" />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* OG / Twitter */}
      <meta property="og:locale" content="ja_JP" />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* 構造化データ */}
      {jsonLdFaq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />}
      {jsonLdBreadcrumbs && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }} />
      )}

      <Breadcrumbs items={[{ label: 'シリーズ一覧', to: '/series' }, { label: franchise.name }]} />

      <div className="mb-16 text-center">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase">
          SERIES ARCHIVE
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          {franchise.name}
        </h1>
        <p className="text-slate-400 text-lg">
          全{plays.length}作品 ({startYear || '----'} - {endYearLabel})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Sidebar */}
        <div className="lg:col-span-4 lg:order-2">
          <div className="bg-theater-surface/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan"></span>
              シリーズ・レギュラー
            </h3>

            {/* ✅ Mobile: 先頭5件 横スライド + 全員を見る（モーダル） */}
            <div className="lg:hidden">
              {topActors.length === 0 ? (
                <p className="text-xs text-slate-500">レギュラー情報はまだありません</p>
              ) : (
                <>
                  <div className="relative">
                    {/* うっすら左右フェード（“横に続いてる感”） */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-theater-black/80 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-theater-black/80 to-transparent" />

                    <div className="-mx-2 px-2 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                      {topActors.slice(0, 5).map(({ actor, count }, index) => (
                        <Link
                          key={actor.slug}
                          to={`/actors/${actor.slug}`}
                          className="snap-start shrink-0 w-[240px] flex items-center gap-3 group p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
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
                    </div>
                  </div>

                  {topActors.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setIsAllActorsOpen(true)}
                      className="mt-4 w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs font-bold hover:bg-white/10 transition-colors"
                    >
                      全員を見る（{topActors.length}）
                    </button>
                  )}

                  {/* ✅ 全員を見る：モーダル（Portalで最前面固定） */}
                  <ModalPortal open={isAllActorsOpen}>
                    <div
                      className="fixed inset-0 z-[2147483647] bg-black/70 backdrop-blur-sm"
                      onMouseDown={(e) => {
                        // 背景クリックで閉じる（外側だけ）
                        if (e.target === e.currentTarget) setIsAllActorsOpen(false);
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
                            maxHeight: 'calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
                          }}
                        >
                          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                            <p className="text-sm font-bold text-white">シリーズ・レギュラー（全{topActors.length}）</p>
                            <button
                              type="button"
                              onClick={() => setIsAllActorsOpen(false)}
                              className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10"
                            >
                              閉じる
                            </button>
                          </div>

                          {/* ✅ ここだけスクロールさせる（背景はロック済み） */}
                          <div className="p-4 overflow-y-auto overscroll-contain">
                            <div className="space-y-2">
                              {topActors.map(({ actor, count }, index) => (
                                <Link
                                  key={actor.slug}
                                  to={`/actors/${actor.slug}`}
                                  onClick={() => setIsAllActorsOpen(false)}
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
                            </div>
                          </div>

                          <div className="h-2 shrink-0" />
                        </div>
                      </div>
                    </div>
                  </ModalPortal>
                </>
              )}
            </div>

            {/* ✅ Desktop: 従来の縦リスト */}
            <div className="hidden lg:block">
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
        </div>

        {/* Main */}
        <div className="lg:col-span-8 lg:order-1 space-y-12">
          {/* ✅ Series Info：自動要約は固定 + 手動は追加で積む + 長文は折りたたみ */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan"></span>
              Series Info
            </h2>

            {/* 固定（自動挿入） */}
            <p className="text-slate-300 text-sm leading-relaxed font-light whitespace-pre-wrap">{autoIntro}</p>

            {/* 追加（手動 intro） */}
            {manualIntro && (
              <p className="mt-4 text-slate-300 text-sm leading-relaxed font-light whitespace-pre-wrap">{manualIntro}</p>
            )}

            {/* 追加（長文 description：折りたたみ） */}
            {longText && (
              <div className="mt-4">
                <div
                  className={`text-slate-400 text-sm leading-relaxed font-light whitespace-pre-wrap transition-all duration-300 ${
                    isIntroOpen ? '' : 'line-clamp-3'
                  }`}
                >
                  {longText}
                </div>

                <button
                  type="button"
                  onClick={() => setIsIntroOpen((v) => !v)}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neon-cyan hover:text-white transition-colors"
                >
                  {isIntroOpen ? '閉じる' : '続きを読む'}
                  <svg
                    className={`w-4 h-4 transition-transform ${isIntroOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </section>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-0 w-px bg-gradient-to-b from-neon-cyan/50 via-neon-cyan/20 to-transparent"></div>

            <div className="space-y-6">
              {sortedPlays.map((play) => (
                <div key={play.slug} className="relative pl-12 flex flex-col">
                  <div className="absolute left-[15px] top-0 w-2.5 h-2.5 rounded-full bg-neon-cyan shadow-[0_0_10px_#00FFFF] ring-4 ring-theater-black"></div>

                  <div className="mb-1 text-xs font-mono text-neon-cyan/80 tracking-wider">{play.period || 'Year Unknown'}</div>

                  <PlayCard play={play as any} className="h-auto w-full" />
                </div>
              ))}

              {sortedPlays.length === 0 && <p className="text-slate-500 italic">登録されている作品はありません。</p>}
            </div>
          </div>

          {/* FAQ */}
          <section className="pt-8 border-t border-white/5 mt-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-slate-500 rounded-full"></span>
              よくある質問 (FAQ)
            </h2>

            <div className="grid gap-4">
              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-cyan">Q.</span>
                  {franchise.name}の舞台作品は何作品ありますか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">現在、{plays.length}作品が登録されています。</p>
              </div>

              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-cyan">Q.</span>
                  どの順番で見ればいいですか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">
                  基本的には公開年順（{startYear || '----'}年〜）に見ることをお勧めします。このページでは時系列順に作品を掲載しています。
                </p>
              </div>

              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-cyan">Q.</span>
                  配信（VOD）で見られる作品はありますか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">
                  {hasVod
                    ? 'はい、シリーズ作品の多くは動画配信サービスで視聴可能です。各作品カードに配信リンクがあるか確認してください。'
                    : '作品によっては配信が行われていないものもあります。詳細は各作品ページをご確認ください。'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetail;
