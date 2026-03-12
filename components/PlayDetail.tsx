// src/components/PlayDetail.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

import { getPlayBySlug } from "../lib/utils/getPlayBySlug";
import { getActorsByPlaySlug } from "../lib/utils/getActorsByPlaySlug";
import { normalizeActorRow } from "../lib/utils/normalizeActorRow";
import { toPlainText, truncate } from "../lib/utils/text";
import { useSiteUrl, useOgImage } from "../lib/hooks/useSiteUrl";

import ActorCard from "./ActorCard";
import TagBadge from "./TagBadge";
import FavoriteButton from "./FavoriteButton";
import ShareButton from "./ShareButton";
import Breadcrumbs from "./Breadcrumbs";
import SeoHead from "./SeoHead";

import type { Actor } from "../lib/types";

type CreditItem = {
  role: string;
  names: string[] | string;
  is_core?: boolean;
  sort_order?: number;
};

type CreditsObj = {
  items?: CreditItem[];
};

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

  // 表示用：最終的には string[] に寄せる
  tags?: string[] | null;

  franchise?: string | null;
  franchise_id?: string | null;

  // plays.credits(jsonb) は {items:[...]} or [...] の両対応で吸収する
  credits?: CreditsObj | CreditItem[] | null;
};

const SITE_NAME = "Stage Connect";

const PlayDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [play, setPlay] = useState<PlayRecord | null>(null);
  const [cast, setCast] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 任意スタッフの折りたたみ
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  // -------------------------
  // Helpers
  // -------------------------
  const normalizeNames = (names: any): string => {
    if (!names) return "";
    if (Array.isArray(names)) return names.filter(Boolean).join("　/　");
    if (typeof names === "string") return names.trim();
    if (typeof names === "object") {
      const items = (names.items ?? names.names ?? null) as any;
      if (Array.isArray(items)) return items.filter(Boolean).join("　/　");
    }
    return String(names);
  };

  const siteUrl = useSiteUrl();
  const ogImageBase = useOgImage();

  // -------------------------
  // credits：DBの形揺れを吸収して items[] を取り出す
  // -------------------------
  const extractCreditItems = (raw: any): CreditItem[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as CreditItem[];
    if (typeof raw === "object" && Array.isArray(raw.items)) return raw.items as CreditItem[];
    return [];
  };

  // -------------------------
  // credits を表示用に正規化
  // -------------------------
  const creditsAll = useMemo(() => {
    const list = extractCreditItems(play?.credits) as CreditItem[];
    return list
      .map((c) => ({
        role: String(c.role ?? "").trim(),
        namesRaw: c.names,
        namesText: normalizeNames(c.names),
        is_core: Boolean((c as any).is_core),
        sort_order: typeof (c as any).sort_order === "number" ? (c as any).sort_order : 999,
      }))
      .filter((c) => c.role && c.namesText)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [play?.credits]);

  // UI上で最初に見せたい役職だけを固定
  // DBの is_core は広めについていても、表示の主役は role 名で制御する
  const isCoreRole = (role: string) => {
    const r = role.replace(/\s/g, "");
    return r === "演出" || r === "脚本" || r === "脚本・作詞" || r === "主催";
  };

  const creditsCore = useMemo(() => {
    return creditsAll.filter((c) => isCoreRole(c.role)).sort((a, b) => a.sort_order - b.sort_order);
  }, [creditsAll]);

  const creditsExtra = useMemo(() => {
    return creditsAll.filter((c) => !isCoreRole(c.role)).sort((a, b) => a.sort_order - b.sort_order);
  }, [creditsAll]);

  const hasAnyCredits = creditsAll.length > 0;

  // castNames（表示用）
  const castTop = useMemo(() => cast.slice(0, 3).map((a) => a.name).join("、"), [cast]);
  const castNames = castTop ? `${castTop}ら` : "未定";

  // hasVod
  const hasVodLinks = useMemo(() => !!play?.vod?.dmm, [play]);

  // -------------------------
  // SEO head
  // -------------------------
  const canonicalUrl = useMemo(() => {
    if (!play?.slug || !siteUrl) return "";
    return `${siteUrl}/plays/${encodeURIComponent(play.slug)}`;
  }, [play?.slug, siteUrl]);

  const seoTitle = useMemo(() => {
    if (!play) return SITE_NAME;
    return `${play.title}｜キャスト・配信（VOD）・公演情報 - ${SITE_NAME}`;
  }, [play]);

  const seoDescription = useMemo(() => {
    if (!play) return "2.5次元舞台・ミュージカル作品のキャスト/配信(VOD)/公演情報をまとめるStage Connect。";

    const base = play.summary ? toPlainText(play.summary) : "";
    const period = play.period ? `期間：${toPlainText(play.period)}。` : "";
    const venue = play.venue ? `劇場：${toPlainText(play.venue)}。` : "";
    const castLine = castTop ? `出演：${castTop}。` : "";
    const vodLine = hasVodLinks ? "VOD配信情報あり。" : "VOD配信情報は確認中。";

    const composed = base
      ? base
      : `舞台『${play.title}』の公演データとキャスト、配信（VOD）情報をまとめました。${castLine}${period}${venue}${vodLine}`;

    return truncate(composed, 155);
  }, [play, castTop, hasVodLinks]);

  const ogImage = ogImageBase;

  // -------------------------
  // JSON-LD
  // -------------------------
  const jsonLdFaq = useMemo(() => {
    if (!play) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `『${play.title}』は動画配信されていますか？`,
          acceptedAnswer: {
            "@type": "Answer",
            text: hasVodLinks
              ? "はい、DMM TVで配信されています。見放題対象かレンタルかは作品によって異なりますので、詳細はページ内の「配信で見る」セクションからご確認ください。DMMプレミアムなら14日間の無料トライアルがあります。"
              : "現在、主要な配信サービスでの取り扱い情報は確認中です。DMMプレミアムで今後配信される可能性もありますので、定期的にチェックしてみてください。",
          },
        },
        {
          "@type": "Question",
          name: "無料で視聴できる期間はありますか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "DMMプレミアムでは14日間の無料トライアルを提供しています。期間中は見放題対象の2.5次元舞台を追加料金なしで視聴できます。",
          },
        },
        {
          "@type": "Question",
          name: "出演キャストは誰ですか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: `主な出演者は${castNames}です。ページ下部の「出演キャスト」セクションで全キャスト詳細を確認できます。`,
          },
        },
      ],
    };
  }, [play, hasVodLinks, castNames]);

  const jsonLdBreadcrumbs = useMemo(() => {
    if (!play || !canonicalUrl) return null;

    const itemList = [
      { "@type": "ListItem", position: 1, name: "作品一覧", item: `${siteUrl}/plays` },
      { "@type": "ListItem", position: 2, name: play.title, item: canonicalUrl },
    ];

    return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: itemList };
  }, [play, canonicalUrl, siteUrl]);

  const jsonLdCreativeWork = useMemo(() => {
    if (!play || !canonicalUrl) return null;

    const tags = (play.tags ?? []).filter(Boolean);
    const genre = play.franchise ? String(play.franchise) : undefined;

    return {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: play.title,
      url: canonicalUrl,
      description: seoDescription,
      inLanguage: "ja",
      keywords: tags.length > 0 ? tags.join(",") : undefined,
      genre,
      isPartOf: play.franchise ? { "@type": "CreativeWorkSeries", name: play.franchise } : undefined,
    };
  }, [play, canonicalUrl, seoDescription]);

  // -------------------------
  // Data fetch
  // -------------------------
  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const fetchPlay = async () => {
      setLoading(true);
      setNotFound(false);
      setIsCreditsOpen(false);

      try {
        let dbPlay: any = null;

        try {
          const { data, error } = await supabase
            .from("plays")
            .select("id,slug,title,summary,period,venue,vod,franchise_id,credits")
            .eq("slug", slug)
            .maybeSingle();

          if (!error && data) dbPlay = data;
        } catch (err) {
          console.warn("[PlayDetail] plays query failed:", err);
        }

        let mappedPlay: PlayRecord | null = null;
        let castActors: Actor[] = [];

        // 1) DBが取れた
        if (dbPlay) {
          // tags は play_tags を正として取る
          let resolvedTags: string[] = [];
          try {
            const { data: pt, error: ptErr } = await supabase
              .from("play_tags")
              .select("tag:tags(name)")
              .eq("play_id", dbPlay.id);

            if (!ptErr && pt) {
              resolvedTags = pt.map((x: any) => x?.tag?.name).filter(Boolean);
            }
          } catch (err) {
            console.warn("[PlayDetail] play_tags query failed:", err);
          }

          mappedPlay = {
            id: dbPlay.id,
            slug: dbPlay.slug,
            title: dbPlay.title,
            summary: dbPlay.summary ?? null,
            period: dbPlay.period ?? null,
            venue: dbPlay.venue ?? null,
            vod: dbPlay.vod ?? null,
            tags: resolvedTags.length ? resolvedTags : null,
            franchise_id: dbPlay.franchise_id ?? null,
            franchise: null,
            credits: dbPlay.credits ?? null,
          };

          // franchise名
          if (dbPlay.franchise_id) {
            try {
              const { data: fr, error: frErr } = await supabase
                .from("franchises")
                .select("name")
                .eq("id", dbPlay.franchise_id)
                .maybeSingle();
              if (!frErr && fr?.name) mappedPlay.franchise = fr.name;
            } catch (err) {
              console.warn("[PlayDetail] franchises query failed:", err);
            }
          }

          // casts → actors
          if (dbPlay.id) {
            try {
              const { data: castRows, error: castError } = await supabase
                .from("casts")
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
                .eq("play_id", dbPlay.id)
                .order("is_starring", { ascending: false })
                .order("created_at", { ascending: true });

              if (!castError && castRows && castRows.length > 0) {
                castActors = (castRows as any[])
                  .map((row) => row.actor)
                  .filter(Boolean)
                  .map(normalizeActorRow);
              }
            } catch (err) {
              console.warn("[PlayDetail] casts query failed:", err);
            }
          }
        }

        // 2) DBが無い → ローカル
        if (!dbPlay) {
          const localPlay: any = getPlayBySlug(slug);
          if (!localPlay) {
            if (!cancelled) {
              setNotFound(true);
              setPlay(null);
              setCast([]);
            }
            return;
          }

          mappedPlay = {
            slug: localPlay.slug,
            title: localPlay.title,
            summary: localPlay.summary,
            period: localPlay.period,
            venue: localPlay.venue,
            vod: localPlay.vod,
            tags: localPlay.tags ?? null,
            franchise: typeof localPlay.franchise === "string" ? localPlay.franchise : null,
            credits: localPlay.credits ?? null,
          };

          castActors = getActorsByPlaySlug(slug);
        }

        // DB playは取れたが casts が0 → ローカル補完
        if (dbPlay && castActors.length === 0) {
          castActors = getActorsByPlaySlug(slug);
        }

        if (cancelled) return;

        if (mappedPlay) setPlay(mappedPlay);
        setCast(castActors);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPlay();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // -------------------------
  // 早期return
  // -------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <title>読み込み中… - {SITE_NAME}</title>
        <meta name="robots" content="noindex,nofollow" />

        <p className="text-slate-400 text-sm mb-2">作品情報を読み込み中…</p>
        <div className="w-10 h-10 border-2 border-white/20 border-t-neon-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!play || notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <title>作品が見つかりません - {SITE_NAME}</title>
        <meta name="robots" content="noindex,nofollow" />

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

  return (
    <div className="container mx-auto px-6 pt-8 pb-32 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        robots="index,follow"
        metas={[
          { property: "og:locale", content: "ja_JP" },
          { property: "og:type", content: "article" },
          { property: "og:site_name", content: SITE_NAME },
          { property: "og:title", content: seoTitle },
          { property: "og:description", content: seoDescription },
          ...(canonicalUrl ? [{ property: "og:url", content: canonicalUrl }] : []),
          ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
          { name: "twitter:card", content: ogImage ? "summary_large_image" : "summary" },
          { name: "twitter:title", content: seoTitle },
          { name: "twitter:description", content: seoDescription },
          ...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
        ]}
        jsonLd={[jsonLdFaq, jsonLdBreadcrumbs, jsonLdCreativeWork].filter(Boolean)}
      />

      <Breadcrumbs items={[{ label: "作品一覧", to: "/plays" }, { label: play.title }]} />

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
              <ShareButton title={play.title} text={`${play.title}の作品情報 | ${SITE_NAME}`} className="shrink-0" />
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
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-pink"></span>
              INTRODUCTION
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-light">
              舞台『<span className="font-bold text-white">{play.title}</span>』の配信情報（VOD）と公演データをまとめました。出演キャストは{castNames}。
              {hasVodLinks
                ? "視聴できるサービスがある場合は、下記リンクから詳細を確認できます（配信状況は変動する場合があります）。"
                : "現在、主要な配信サービスでの取り扱い情報は確認中ですが、DVD/Blu-ray等で視聴可能な場合があります。"}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide">あらすじ</h2>
            <div className="prose prose-invert max-w-none text-slate-300 leading-8 font-light">
              {play.summary || "概要情報はまだありません。"}
            </div>
          </section>

          <section className="bg-theater-surface rounded-xl border border-white/5 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">公演情報</h3>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <span className="min-w-[4rem] text-sm font-bold text-neon-purple tracking-wider">期間</span>
                <span className="text-slate-200 text-sm font-medium">{play.period || "未定"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <span className="min-w-[4rem] text-sm font-bold text-neon-purple tracking-wider">劇場</span>
                <span className="text-slate-200 text-sm font-medium">{play.venue || "未定"}</span>
              </div>
            </div>
          </section>

          {hasAnyCredits && (
            <section className="bg-theater-surface/70 rounded-xl border border-white/10 p-8 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-[-40%] left-[-10%] w-[260px] h-[260px] bg-neon-cyan/10 blur-[90px] rounded-full pointer-events-none" />

              <div className="flex items-center justify-between gap-3 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">スタッフ / クレジット</h3>

                {creditsExtra.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCreditsOpen((v) => !v)}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors font-bold"
                  >
                    {isCreditsOpen ? "閉じる" : `続きを読む（${creditsExtra.length}）`}
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {creditsCore.map((c, idx) => (
                  <div
                    key={`${c.role}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                  >
                    <span className="min-w-[6rem] text-sm font-bold text-neon-purple tracking-wider">{c.role}</span>
                    <span className="text-slate-200 text-sm font-medium leading-relaxed whitespace-pre-wrap">{c.namesText}</span>
                  </div>
                ))}

                {creditsExtra.length > 0 && isCreditsOpen && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="space-y-5 mt-4">
                      {creditsExtra.map((c, idx) => (
                        <div
                          key={`${c.role}-${idx}`}
                          className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                        >
                          <span className="min-w-[6rem] text-sm font-bold text-neon-cyan tracking-wider">{c.role}</span>
                          <span className="text-slate-200 text-sm font-medium leading-relaxed whitespace-pre-wrap">{c.namesText}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {hasVodLinks && (
            <section className="pt-4">
              <h2 className="text-lg font-bold text-white mb-4 tracking-wide flex items-center gap-2">
                配信で見る
                <span className="text-[10px] font-normal text-slate-500 border border-slate-700 px-2 py-0.5 rounded ml-2">
                  外部リンク
                </span>
              </h2>
              <p className="text-xs text-slate-500 mb-4 font-light">DMMプレミアムなら14日間無料でお試しできます。</p>
              <div className="flex flex-wrap gap-4">
                <a
                  href={play.vod!.dmm!}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-neon-pink/10 border border-neon-pink/30 text-white text-sm font-bold hover:bg-neon-pink/20 hover:border-neon-pink/50 hover:shadow-[0_0_15px_rgba(233,68,166,0.3)] transition-all duration-300 min-w-[180px]"
                >
                  DMM TVで見る
                  <svg className="ml-2 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </section>
          )}

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
                    ? "はい、DMM TVで配信されています。見放題対象かレンタルかは作品によって異なりますので、詳細は「配信で見る」セクションからご確認ください。DMMプレミアムなら14日間の無料トライアルがあります。"
                    : "現在、配信情報は確認中です。DMMプレミアムで今後配信される可能性もありますので、定期的にチェックしてみてください。"}
                </p>
              </div>

              <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                  <span className="text-neon-pink">Q.</span>
                  無料で視聴できる期間はありますか？
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed pl-5">
                  DMMプレミアムでは14日間の無料トライアルを提供しています。期間中は見放題対象の2.5次元舞台を追加料金なしで視聴できます。
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