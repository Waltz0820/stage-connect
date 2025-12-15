import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { getPlayBySlug } from '../lib/utils/getPlayBySlug';
import { getActorsByPlaySlug } from '../lib/utils/getActorsByPlaySlug';

import ActorCard from './ActorCard';
import TagBadge from './TagBadge';
import FavoriteButton from './FavoriteButton';
import ShareButton from './ShareButton';
import Breadcrumbs from './Breadcrumbs';

import type { Actor } from '../lib/types';

type PlayRecord = {
  id?: string;
  slug: string;
  title: string;
  summary?: string | null;
  period?: string | null;
  venue?: string | null;
  vod?: {
    dmm?: string;
    danime?: string;
    unext?: string;
    [key: string]: any;
  } | null;
  tags?: string[] | null;
  franchise?: string | null;
  franchise_id?: string | null;
};

const PlayDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [play, setPlay] = useState<PlayRecord | null>(null);
  const [cast, setCast] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchPlay = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        console.log('[PlayDetail] slug:', slug);

        // =========================
        // 1) plays をまず確実に取る（select('*')で 400 を回避）
        // =========================
        let dbPlay: any = null;

        try {
          const { data, error } = await supabase
            .from('plays')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

          console.log('[PlayDetail] plays fetch:', { data, error });

          if (!error && data) dbPlay = data;
        } catch (err) {
          console.warn('[PlayDetail] plays query failed:', err);
        }

        let mappedPlay: PlayRecord | null = null;
        let castActors: Actor[] = [];

        // =========================
        // 2) DBから play が取れた場合
        // =========================
        if (dbPlay) {
          mappedPlay = {
            id: dbPlay.id,
            slug: dbPlay.slug,
            title: dbPlay.title,
            summary: dbPlay.summary ?? null,
            period: dbPlay.period ?? null,
            venue: dbPlay.venue ?? null,
            vod: dbPlay.vod ?? null,
            tags: dbPlay.tags ?? null,
            franchise_id: dbPlay.franchise_id ?? null,
            franchise: null,
          };

          // ---- franchise 名は別クエリ（リレーション埋め込み不要）----
          if (dbPlay.franchise_id) {
            try {
              const { data: fr, error: frErr } = await supabase
                .from('franchises')
                .select('name')
                .eq('id', dbPlay.franchise_id)
                .maybeSingle();

              if (!frErr && fr?.name) {
                mappedPlay.franchise = fr.name;
              }
            } catch (err) {
              console.warn('[PlayDetail] franchises query failed:', err);
            }
          }

          // =========================
          // 3) casts → actors を取得（ここが作品側キャスト表示の本体）
          // =========================
          if (dbPlay.id) {
            try {
              const { data: castRows, error: castError } = await supabase
                .from('casts')
                .select(
                  `
                  is_starring,
                  role_name,
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
                .eq('play_id', dbPlay.id)
                .order('is_starring', { ascending: false })
                .order('created_at', { ascending: true });

              console.log('[PlayDetail] casts fetch:', { castRows, castError });

              if (!castError && castRows && castRows.length > 0) {
                castActors = castRows
                  .map((row: any) => row.actor)
                  .filter(Boolean) as Actor[];
              }
            } catch (err) {
              console.warn('[PlayDetail] casts query failed:', err);
            }
          }
        }

        // =========================
        // 4) DBが取れない/キャスト0ならローカルへフォールバック
        // =========================
        if (!dbPlay) {
          const localPlay = getPlayBySlug(slug);
          if (!localPlay) {
            setNotFound(true);
            setPlay(null);
            setCast([]);
            return;
          }

          mappedPlay = {
            slug: localPlay.slug,
            title: localPlay.title,
            summary: localPlay.summary,
            period: localPlay.period,
            venue: localPlay.venue,
            vod: localPlay.vod,
            tags: localPlay.tags,
            franchise: typeof localPlay.franchise === 'string' ? localPlay.franchise : null,
          };

          castActors = getActorsByPlaySlug(slug);
        }

        // DB play は取れたが casts が0だった場合もローカルで補完（任意）
        if (dbPlay && castActors.length === 0) {
          castActors = getActorsByPlaySlug(slug);
        }

        if (mappedPlay) setPlay(mappedPlay);
        setCast(castActors);
      } finally {
        setLoading(false);
      }
    };

    fetchPlay();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <p className="text-slate-400 text-sm mb-2">作品情報を読み込み中...</p>
        <div className="w-10 h-10 border-2 border-white/20 border-t-neon-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!play || notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white">作品が見つかりませんでした</h2>
        <p className="mt-2 text-slate-400">お探しの作品は見つかりませんでした。</p>
        <Link
          to="/plays"
          className="mt-8 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 hover:border-neon-purple/50 transition-colors"
        >
          一覧に戻る
        </Link>
      </div>
    );
  }

  const hasVodLinks = !!(play.vod && (play.vod.dmm || play.vod.danime || play.vod.unext));

  // ✅ 自動生成テキスト用データ
  const castTop = cast.slice(0, 3).map((a) => a.name).join('、');
  const castNames = castTop ? `${castTop}ら` : '未定';

  // ✅ JSON-LD（FAQPage）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `舞台『${play.title}』は動画配信されていますか？`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: hasVodLinks
            ? 'はい、DMM TVやdアニメストア、U-NEXTなどで配信されている場合があります。詳細はページ内の「配信で見る」セクションをご確認ください。'
            : '現在、主要なVODサービスでの定額見放題配信などは確認できていませんが、レンタル配信やディスク販売が行われている可能性があります。',
        },
      },
      {
        '@type': 'Question',
        name: '無料で視聴できる期間はありますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'VODサービスによっては、初回登録時の無料トライアル期間を利用して視聴できる場合があります。各サービスの公式サイトで最新のキャンペーン情報をご確認ください。',
        },
      },
      {
        '@type': 'Question',
        name: '出演キャストは誰ですか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `主な出演者は${castNames}です。ページ下部の「出演キャスト」セクションで全キャスト詳細を確認できます。`,
        },
      },
    ],
  };

  return (
    <div className="container mx-auto px-6 pt-8 pb-32 lg:px-8 max-w-5xl animate-fade-in-up">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs items={[{ label: '作品一覧', to: '/plays' }, { label: play.title }]} />

      <div className="mb-16 border-b border-white/10 pb-8">
        <div className="flex flex-col gap-4">
          <div>
            {play.franchise && (
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-neon-pink mb-4 bg-neon-pink/10 px-3 py-1 rounded border border-neon-pink/20 shadow-[0_0_10px_rgba(233,68,166,0.2)]">
                {play.franchise}
              </span>
            )}

            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                {play.title}
              </h1>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <FavoriteButton slug={play.slug} type="play" size="lg" className="shrink-0" />
              <ShareButton title={play.title} text={`${play.title}の作品情報 | Stage Connect`} className="shrink-0" />
            </div>

            {play.tags && play.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {play.tags.map((tag) => (
                  <TagBadge key={tag}>{tag}</TagBadge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
        <div className="md:col-span-2 space-y-12">
          {/* ✅ Intro（自動生成） */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-pink"></span>
              INTRODUCTION
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-light">
              舞台『<span className="font-bold text-white">{play.title}</span>』の配信情報（VOD）と公演データをまとめました。
              出演キャストは{castNames}。
              {hasVodLinks
                ? '視聴できるサービスがある場合は、下記リンクから詳細を確認できます（配信状況は変動する場合があります）。'
                : '現在、主要な配信サービスでの取り扱い情報は確認中ですが、DVD/Blu-ray等で視聴可能な場合があります。'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide">あらすじ</h2>
            <div className="prose prose-invert max-w-none text-slate-300 leading-8 font-light">
              {play.summary || '概要情報はまだありません。'}
            </div>
          </section>

          <section className="bg-theater-surface rounded-xl border border-white/5 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">公演情報</h3>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <span className="min-w-[4rem] text-sm font-bold text-neon-purple tracking-wider">期間</span>
                <span className="text-slate-200 text-sm font-medium">{play.period || '未定'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <span className="min-w-[4rem] text-sm font-bold text-neon-purple tracking-wider">劇場</span>
                <span className="text-slate-200 text-sm font-medium">{play.venue || '未定'}</span>
              </div>
            </div>
          </section>

          {hasVodLinks && (
            <section className="pt-4">
              <h2 className="text-lg font-bold text-white mb-6 tracking-wide flex items-center gap-2">
                配信で見る
                <span className="text-[10px] font-normal text-slate-500 border border-slate-700 px-2 py-0.5 rounded ml-2">
                  外部リンク
                </span>
              </h2>
              <div className="flex flex-wrap gap-4">
                {play.vod?.dmm && (
                  <a
                    href={play.vod.dmm}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#E53935]/10 border border-[#E53935]/30 text-[#ff8a80] text-sm font-bold hover:bg-[#E53935]/20 hover:border-[#E53935] hover:shadow-[0_0_15px_rgba(229,57,53,0.3)] transition-all duration-300 min-w-[140px]"
                  >
                    DMM TV
                  </a>
                )}
                {play.vod?.danime && (
                  <a
                    href={play.vod.danime}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#FF9800]/10 border border-[#FF9800]/30 text-[#ffcc80] text-sm font-bold hover:bg-[#FF9800]/20 hover:border-[#FF9800] hover:shadow-[0_0_15px_rgba(255,152,0,0.3)] transition-all duration-300 min-w-[140px]"
                  >
                    dアニメストア
                  </a>
                )}
                {play.vod?.unext && (
                  <a
                    href={play.vod.unext}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1E88E5]/10 border border-[#1E88E5]/30 text-[#90caf9] text-sm font-bold hover:bg-[#1E88E5]/20 hover:border-[#1E88E5] hover:shadow-[0_0_15px_rgba(30,136,229,0.3)] transition-all duration-300 min-w-[140px]"
                  >
                    U-NEXT
                  </a>
                )}
              </div>
            </section>
          )}

          {/* ✅ FAQ（表示） */}
          <section className="pt-8 border-t border-white/5 mt-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-slate-500 rounded-full"></span>
              よくある質問 (FAQ)
            </h2>

            <div className="grid gap-4">
              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-pink">Q.</span>
                  舞台『{play.title}』は動画配信されていますか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">
                  {hasVodLinks
                    ? 'はい、DMM TVやdアニメストア、U-NEXTなどで配信されている場合があります。詳細はページ内の「配信で見る」セクションをご確認ください。'
                    : '現在、主要なVODサービスでの定額見放題配信などは確認できていませんが、レンタル配信やディスク販売が行われている可能性があります。'}
                </p>
              </div>

              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-pink">Q.</span>
                  無料で視聴できる期間はありますか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">
                  VODサービスによっては、初回登録時の無料トライアル期間を利用して視聴できる場合があります。各サービスの公式サイトで最新のキャンペーン情報をご確認ください。
                </p>
              </div>

              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-pink">Q.</span>
                  出演キャストは誰ですか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">
                  主な出演者は{castNames}です。ページ下部の「出演キャスト」セクションで全キャスト詳細を確認できます。
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="pt-16 border-t border-white/10 mt-16">
        <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">出演キャスト</h2>

        {cast.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cast.map((actor) => (
              <ActorCard key={actor.slug} actor={actor} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 italic">登録されている出演俳優はいません。</p>
        )}
      </section>
    </div>
  );
};

export default PlayDetail;
