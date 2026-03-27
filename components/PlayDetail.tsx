// src/components/PlayDetail.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

import { getPlayBySlug } from "../lib/utils/getPlayBySlug";
import { getActorsByPlaySlug } from "../lib/utils/getActorsByPlaySlug";
import { normalizeActorRow } from "../lib/utils/normalizeActorRow";
import { toPlainText, truncate } from "../lib/utils/text";
import { useSiteUrl, useOgImage } from "../lib/hooks/useSiteUrl";

import CastCard from "./CastCard";
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

  tags?: string[] | null;

  franchise?: string | null;
  franchise_id?: string | null;
  franchise_slug?: string | null;

  credits?: CreditsObj | CreditItem[] | null;
};

type PlayCast = {
  actor: Actor;
  roleName?: string | null;
  castGroup?: string | null;
  isStarring?: boolean | null;
};

const SITE_NAME = "Stage Connect";
const CREDIT_VISIBLE_COUNT = 3;

const mergeDelimitedValues = (...values: Array<string | null | undefined>): string | null => {
  const parts = values
    .flatMap((value) => String(value ?? "").split("/"))
    .map((value) => value.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;
  return Array.from(new Set(parts)).join(" / ");
};

const splitSlashList = (value?: string | null) =>
  String(value ?? "")
    .split(" / ")
    .map((item) => item.trim())
    .filter(Boolean);

const parseScheduleEntries = (period?: string | null) =>
  String(period ?? "")
    .split(" / ")
    .map((item) => item.trim())
    .filter(Boolean);

const extractPeriodSummary = (period?: string | null) => {
  if (!period) return null;

  const fullDates = Array.from(period.matchAll(/(\d{4})\/(\d{1,2})\/(\d{1,2})/g)).map((match) => ({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }));

  if (fullDates.length === 0) return null;

  const first = fullDates[0];
  let endYear = first.year;
  let endMonth = first.month;
  let endDay = first.day;

  const monthDayMatches = Array.from(period.matchAll(/(?:\d{4}\/)?(\d{1,2})\/(\d{1,2})/g)).map((match) => ({
    raw: match[0],
    month: Number(match[1]),
    day: Number(match[2]),
    hasYear: /^\d{4}\//.test(match[0]),
  }));

  for (const item of monthDayMatches) {
    if (item.hasYear) {
      const yearMatch = item.raw.match(/^(\d{4})\//);
      endYear = yearMatch ? Number(yearMatch[1]) : endYear;
      endMonth = item.month;
      endDay = item.day;
      continue;
    }

    if (item.month < endMonth) endYear += 1;
    endMonth = item.month;
    endDay = item.day;
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  const start = `${first.year}/${pad(first.month)}/${pad(first.day)}`;
  const end = `${endYear}/${pad(endMonth)}/${pad(endDay)}`;

  if (start === end) return start;

  return `${start}-${end}`;
};

const extractScheduleCities = (period?: string | null) => {
  const cities = parseScheduleEntries(period)
    .map((entry) => {
      const colonSplit = entry.split(/[:：]/);
      if (colonSplit.length > 1) return colonSplit[0].trim();
      const direct = entry.match(/^([^\d]+?)\s+\d{4}\//);
      return direct ? direct[1].trim() : "";
    })
    .filter(Boolean);

  return Array.from(new Set(cities));
};

const summarizeVenues = (venue?: string | null) => {
  const venues = splitSlashList(venue);

  if (venues.length === 0) return null;
  if (venues.length <= 3) return venues.join(" / ");
  return `${venues.slice(0, 2).join(" / ")} / ほか${venues.length - 2}会場`;
};

const PlayDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [play, setPlay] = useState<PlayRecord | null>(null);
  const [cast, setCast] = useState<PlayCast[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const scrollToCast = () => {
    if (typeof document === "undefined") return;
    const castSection = document.getElementById("cast");
    if (!castSection) return;
    castSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href="#cast"]');
      if (!anchor) return;

      event.preventDefault();
      scrollToCast();
    };

    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, []);

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

  const extractCreditItems = (raw: any): CreditItem[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as CreditItem[];
    if (typeof raw === "object" && Array.isArray(raw.items)) return raw.items as CreditItem[];
    return [];
  };

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

  const creditsVisible = useMemo(() => {
    return creditsAll.slice(0, CREDIT_VISIBLE_COUNT);
  }, [creditsAll]);

  const creditsCollapsed = useMemo(() => {
    return creditsAll.slice(CREDIT_VISIBLE_COUNT);
  }, [creditsAll]);

  const hasAnyCredits = creditsAll.length > 0;
  const scheduleEntries = useMemo(() => parseScheduleEntries(play?.period), [play?.period]);
  const scheduleSummary = useMemo(() => extractPeriodSummary(play?.period), [play?.period]);
  const scheduleCities = useMemo(() => extractScheduleCities(play?.period), [play?.period]);
  const venueList = useMemo(() => splitSlashList(play?.venue), [play?.venue]);
  const compactVenueSummary = useMemo(() => summarizeVenues(play?.venue), [play?.venue]);
  const shouldCollapseSchedule = scheduleEntries.length > 2 || venueList.length > 3;
  const groupedCast = useMemo(() => {
    const groups = new Map<string, { name: string | null; items: PlayCast[] }>();

    for (const item of cast) {
      const groupName = item.castGroup?.trim() || null;
      const groupKey = groupName ?? "__ungrouped__";
      const currentGroup = groups.get(groupKey) ?? { name: groupName, items: [] };
      const actorKey = item.actor.slug || item.actor.name;
      const existingIndex = currentGroup.items.findIndex((entry) => (entry.actor.slug || entry.actor.name) === actorKey);

      if (existingIndex === -1) {
        currentGroup.items.push(item);
        groups.set(groupKey, currentGroup);
        continue;
      }

      const existing = currentGroup.items[existingIndex];
      currentGroup.items[existingIndex] = {
        ...existing,
        roleName: mergeDelimitedValues(existing.roleName, item.roleName),
        isStarring: Boolean(existing.isStarring || item.isStarring),
      };
      groups.set(groupKey, currentGroup);
    }

    return Array.from(groups.values());
  }, [cast]);

  const castTop = useMemo(() => cast.slice(0, 3).map((item) => item.actor.name).join("、"), [cast]);
  const castNames = castTop ? `${castTop}ら` : "未定";

  const hasVodLinks = useMemo(() => !!play?.vod?.dmm, [play]);

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
    const vodLine = hasVodLinks ? "VOD配信情報あり。" : "配信情報は確認中。";

    const composed = base
      ? base
      : `${play.title}の公演データとキャスト、配信（VOD）情報をまとめました。${castLine}${period}${venue}${vodLine}`;

    return truncate(composed, 155);
  }, [play, castTop, hasVodLinks]);

  const ogImage = ogImageBase;

  const jsonLdFaq = useMemo(() => {
    if (!play) return null;

    const mainEntity = hasVodLinks
      ? [
          {
            "@type": "Question",
            name: `${play.title}はどこで見られますか？`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "DMM TVで配信されています。見放題対象かレンタルかは作品によって異なりますので、詳細はページ内の「配信で見る」セクションからご確認ください。DMMプレミアムなら14日間の無料トライアルがあります。",
            },
          },
          {
            "@type": "Question",
            name: "無料で視聴できる期間はありますか？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "DMMプレミアムでは14日間の無料トライアルを提供しています。期間中は対象作品を追加料金なしで視聴できる場合があります。",
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
        ]
      : [
          {
            "@type": "Question",
            name: `${play.title}は現在配信されていますか？`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "現在、主要な配信サービスでの取り扱いが確認できない場合があります。古い2.5次元作品はDVD・Blu-ray化や再演で触れられるケースもあります。配信状況は随時確認しています。",
            },
          },
          {
            "@type": "Question",
            name: "この作品を見る方法はありますか？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "配信が確認できない場合は、シリーズの他作品や関連作品、DVD・Blu-ray展開、再演情報などをあわせて確認するのがおすすめです。",
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
        ];

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity,
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

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const fetchPlay = async () => {
      setLoading(true);
      setNotFound(false);
      setIsCreditsOpen(false);
      setIsScheduleOpen(false);

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
        let castActors: PlayCast[] = [];

        if (dbPlay) {
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
            franchise_slug: null,
            credits: dbPlay.credits ?? null,
          };

          if (dbPlay.franchise_id) {
            try {
              const { data: fr, error: frErr } = await supabase
                .from("franchises")
                .select("name,slug")
                .eq("id", dbPlay.franchise_id)
                .maybeSingle();

              if (!frErr && fr) {
                if (fr.name) mappedPlay.franchise = fr.name;
                if (fr.slug) mappedPlay.franchise_slug = fr.slug;
              }
            } catch (err) {
              console.warn("[PlayDetail] franchises query failed:", err);
            }
          }

          if (dbPlay.id) {
            try {
              const { data: castRows, error: castError } = await supabase
                .from("casts")
                .select(`
                  is_starring,
                  billing_order,
                  role_name,
                  cast_group,
                  created_at,
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
                `)
                .eq("play_id", dbPlay.id)
                .order("is_starring", { ascending: false })
                .order("billing_order", { ascending: true, nullsFirst: false })
                .order("created_at", { ascending: true });

              if (!castError && castRows && castRows.length > 0) {
                castActors = (castRows as any[])
                  .map((row) => {
                    if (!row.actor) return null;
                    return {
                      actor: normalizeActorRow(row.actor),
                      roleName: row.role_name ?? null,
                      castGroup: row.cast_group ?? null,
                      isStarring: Boolean(row.is_starring),
                    } satisfies PlayCast;
                  })
                  .filter(Boolean) as PlayCast[];
              }
            } catch (err) {
              console.warn("[PlayDetail] casts query failed:", err);
            }
          }
        }

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
            franchise_slug: localPlay.franchise_slug ?? null,
            credits: localPlay.credits ?? null,
          };

          castActors = getActorsByPlaySlug(slug).map((actor) => ({ actor }));
        }

        if (dbPlay && castActors.length === 0) {
          castActors = getActorsByPlaySlug(slug).map((actor) => ({ actor }));
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <SeoHead title={`読み込み中… - ${SITE_NAME}`} robots="noindex,nofollow" />
        <p className="text-slate-400 text-sm mb-2">作品情報を読み込み中…</p>
        <div className="w-10 h-10 border-2 border-white/20 border-t-neon-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!play || notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <SeoHead title={`作品が見つかりません - ${SITE_NAME}`} robots="noindex,nofollow" />

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
              <Link
                to={`/series/${encodeURIComponent(play.franchise_slug || play.franchise)}`}
                className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-neon-pink mb-4 bg-neon-pink/10 px-3 py-1 rounded border border-neon-pink/20 shadow-[0_0_10px_rgba(233,68,166,0.2)] hover:bg-neon-pink/20 hover:border-neon-pink/40 transition-all"
              >
                {play.franchise}
              </Link>
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
              <span className="font-bold text-white">{play.title}</span>の配信情報（VOD）と公演データをまとめました。出演キャストは{castNames}。
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
                <div className="flex-1">
                  <div className="text-slate-200 text-sm font-medium">
                    {scheduleSummary || play.period || "未定"}
                  </div>
                  {scheduleCities.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      {scheduleCities.length}都市 / {scheduleCities.slice(0, 5).join(" / ")}
                      {scheduleCities.length > 5 ? " / ..." : ""}
                    </div>
                  )}
                  {shouldCollapseSchedule && isScheduleOpen && play.period && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {play.period}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <span className="min-w-[4rem] text-sm font-bold text-neon-purple tracking-wider">劇場</span>
                <div className="flex-1">
                  <div className="text-slate-200 text-sm font-medium">
                    {compactVenueSummary || play.venue || "未定"}
                  </div>
                  {venueList.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">{venueList.length}会場</div>
                  )}
                  {shouldCollapseSchedule && isScheduleOpen && play.venue && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {play.venue}
                    </div>
                  )}
                </div>
              </div>
              {shouldCollapseSchedule && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsScheduleOpen((value) => !value)}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors font-bold"
                  >
                    {isScheduleOpen ? "折りたたむ" : "もっと見る"}
                  </button>
                </div>
              )}
            </div>
          </section>

          {hasAnyCredits && (
            <section className="bg-theater-surface/70 rounded-xl border border-white/10 p-8 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-[-40%] left-[-10%] w-[260px] h-[260px] bg-neon-cyan/10 blur-[90px] rounded-full pointer-events-none" />

              <div className="flex items-center justify-between gap-3 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">スタッフ / クレジット</h3>

                {creditsCollapsed.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCreditsOpen((v) => !v)}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors font-bold"
                  >
                    {isCreditsOpen ? "閉じる" : `続きを読む（${creditsCollapsed.length}）`}
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {creditsVisible.map((c, idx) => (
                  <div
                    key={`${c.role}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                  >
                    <span className="min-w-[6rem] text-sm font-bold text-neon-purple tracking-wider">{c.role}</span>
                    <span className="text-slate-200 text-sm font-medium leading-relaxed whitespace-pre-wrap">{c.namesText}</span>
                  </div>
                ))}

                {creditsCollapsed.length > 0 && isCreditsOpen && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="space-y-5 mt-4">
                      {creditsCollapsed.map((c, idx) => (
                        <div
                          key={`${c.role}-extra-${idx}`}
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

          {hasVodLinks ? (
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
          ) : (
            <section className="pt-4">
              <h2 className="text-lg font-bold text-white mb-4 tracking-wide flex items-center gap-2">
                見る方法を探す
                <span className="text-[10px] font-normal text-slate-500 border border-slate-700 px-2 py-0.5 rounded ml-2">
                  回遊
                </span>
              </h2>
              <p className="text-xs text-slate-500 mb-4 font-light">
                現在この作品の主要配信サービスでの取り扱いは確認中です。シリーズ作品や出演キャストから関連作品を探せます。
              </p>
              <div className="flex flex-wrap gap-4">
                {play.franchise_slug && (
                  <Link
                    to={`/series/${encodeURIComponent(play.franchise_slug)}`}
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 hover:border-neon-purple/40 transition-all duration-300 min-w-[180px]"
                  >
                    シリーズ作品を見る
                  </Link>
                )}

                {cast.length > 0 && (
                  <a
                    href="#cast"
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 hover:border-neon-cyan/40 transition-all duration-300 min-w-[180px]"
                  >
                    出演キャストを見る
                  </a>
                )}

                <Link
                  to="/watch"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-neon-pink/10 border border-neon-pink/30 text-white text-sm font-bold hover:bg-neon-pink/20 hover:border-neon-pink/50 hover:shadow-[0_0_15px_rgba(233,68,166,0.3)] transition-all duration-300 min-w-[180px]"
                >
                  DMMで他作品を探す
                </Link>
              </div>
            </section>
          )}

          <section className="pt-8 border-t border-white/5 mt-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-slate-500 rounded-full"></span>
              よくある質問 (FAQ)
            </h2>

            <div className="grid gap-4">
              {hasVodLinks ? (
                <>
                  <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                      <span className="text-neon-pink">Q.</span>
                      {play.title}はどこで見られますか？
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed pl-5">
                      DMM TVで配信されています。見放題対象かレンタルかは作品によって異なりますので、詳細は「配信で見る」セクションからご確認ください。DMMプレミアムなら14日間の無料トライアルがあります。
                    </p>
                  </div>

                  <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                      <span className="text-neon-pink">Q.</span>
                      無料で視聴できる期間はありますか？
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed pl-5">
                      DMMプレミアムでは14日間の無料トライアルを提供しています。期間中は対象作品を追加料金なしで視聴できる場合があります。
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
                </>
              ) : (
                <>
                  <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                      <span className="text-neon-pink">Q.</span>
                      {play.title}は現在配信されていますか？
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed pl-5">
                      現在、主要な配信サービスでの取り扱いが確認できない場合があります。古い2.5次元作品はDVD・Blu-ray化や再演で触れられるケースもあります。配信状況は随時確認しています。
                    </p>
                  </div>

                  <div className="bg-theater-surface rounded-lg p-6 border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                      <span className="text-neon-pink">Q.</span>
                      この作品を見る方法はありますか？
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed pl-5">
                      配信が確認できない場合は、シリーズの他作品や関連作品、DVD・Blu-ray展開、再演情報などをあわせて確認するのがおすすめです。
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
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      <section id="cast" className="scroll-mt-24 pt-16 border-t border-white/10 mt-16">
        <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">出演キャスト</h2>

        {cast.length > 0 ? (
          <div className="space-y-10">
            {groupedCast.map((group, groupIndex) => (
              <div key={group.name ?? `ungrouped-${groupIndex}`} className="space-y-4">
                {group.name && (
                  <div className="inline-flex items-center rounded-full border border-neon-pink/20 bg-neon-pink/10 px-4 py-1.5 text-sm font-bold tracking-wide text-neon-pink">
                    {group.name}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((castItem) => (
                    <CastCard
                      key={`${castItem.actor.slug}-${castItem.roleName ?? "cast"}-${group.name ?? "ungrouped"}`}
                      actor={castItem.actor}
                      roleName={castItem.roleName || undefined}
                      badge={castItem.isStarring ? "MAIN CAST" : undefined}
                    />
                  ))}
                </div>
              </div>
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
