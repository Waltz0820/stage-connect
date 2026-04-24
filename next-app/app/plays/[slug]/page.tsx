import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { DetailToggleClient } from "../../../components/DetailToggleClient";
import { FavoriteButtonClient } from "../../../components/FavoriteButtonClient";
import { PlayPosterFrame } from "../../../components/PlayPosterFrame";
import { ShareButtonClient } from "../../../components/ShareButtonClient";
import { StructuredData } from "../../../components/StructuredData";
import {
  getCreditItems,
  getPlayDetailBySlug,
  getSeriesDetailBySlug,
  summarizeCast,
  toPlainText,
  truncate,
} from "../../../lib/stage-connect";
import { buildBreadcrumbList } from "../../../lib/structured-data";

type Params = {
  slug: string;
};

type GroupedCast = {
  name: string | null;
  items: Array<{
    slug: string;
    name: string;
    roleName: string | null;
    isStarring: boolean | null;
  }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;
export const dynamicParams = true;

const splitSlashList = (value?: string | null) =>
  String(value ?? "")
    .split(" / ")
    .map((item) => item.trim())
    .filter(Boolean);

const summarizeRoleName = (value?: string | null) => {
  const roles = splitSlashList(value);
  if (roles.length <= 3) return value ?? null;
  return `${roles.slice(0, 3).join(" / ")} / ほか${roles.length - 3}役`;
};

const parseScheduleEntries = (period?: string | null) =>
  String(period ?? "")
    .split(" / ")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeScheduleCity = (city: string) =>
  city
    .normalize("NFKC")
    .trim()
    .replace(/[：:]\s*$/u, "")
    .replace(/\s+/gu, " ")
    .replace(/(?:公演|会場)$/u, "")
    .trim();

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
      const colonSplit = entry.split(/[:・]/);
      if (colonSplit.length > 1) return normalizeScheduleCity(colonSplit[0]);
      const direct = entry.match(/^([^\d]+?)\s+\d{4}\//);
      return direct ? normalizeScheduleCity(direct[1]) : "";
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

const groupCast = (
  cast: Array<{
    slug: string;
    name: string;
    roleName: string | null;
    castGroup: string | null;
    isStarring: boolean | null;
  }>
): GroupedCast[] => {
  const groups = new Map<string, GroupedCast>();

  for (const item of cast) {
    const groupName = item.castGroup?.trim() || null;
    const groupKey = groupName ?? "__ungrouped__";
    const currentGroup = groups.get(groupKey) ?? { name: groupName, items: [] };
    const existingIndex = currentGroup.items.findIndex((entry) => entry.slug === item.slug);

    if (existingIndex === -1) {
      currentGroup.items.push({
        slug: item.slug,
        name: item.name,
        roleName: item.roleName,
        isStarring: item.isStarring,
      });
      groups.set(groupKey, currentGroup);
      continue;
    }

    const existing = currentGroup.items[existingIndex];
    const mergedRoles = Array.from(
      new Set(
        `${existing.roleName ?? ""} / ${item.roleName ?? ""}`
          .split("/")
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );

    currentGroup.items[existingIndex] = {
      ...existing,
      roleName: mergedRoles.length > 0 ? mergedRoles.join(" / ") : null,
      isStarring: Boolean(existing.isStarring || item.isStarring),
    };
    groups.set(groupKey, currentGroup);
  }

  return Array.from(groups.values());
};

const getCastInitials = (item: { slug: string; name: string }) => {
  const slugParts = item.slug
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (slugParts.length > 0) {
    return slugParts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  return item.name.trim().slice(0, 1) || "S";
};

const buildPlayMetaDescriptionJa = (play: NonNullable<Awaited<ReturnType<typeof getPlayDetailBySlug>>>) => {
  const parts: string[] = [];
  const summary = toPlainText(play.summary || "").trim().replace(/[。．]\s*$/u, "");

  if (summary) parts.push(`${summary}。`);

  const factParts: string[] = [];
  if (play.franchiseName) factParts.push(`シリーズ: ${play.franchiseName}`);
  if (play.cast.length > 0) factParts.push(`出演${play.cast.length}人`);
  if (play.vod && Object.keys(play.vod).length > 0) factParts.push("配信あり");
  if (factParts.length > 0) parts.push(`${factParts.join(" / ")}。`);

  if (parts.length === 0) {
    parts.push(`${play.title}の公演情報と出演キャストをまとめたページです。`);
  } else {
    parts.push("出演キャスト、クレジット、公演情報を掲載。");
  }

  return truncate(parts.join(" "), 150);
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) {
    return {
      title: "作品が見つかりません | Stage Connect（ステコネ）",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${play.title}｜キャスト・配信（VOD）・公演情報 | Stage Connect（ステコネ）`,
    description: buildPlayMetaDescriptionJa(play),
    alternates: {
      canonical: `${siteUrl}/plays/${play.slug}`,
      languages: {
        ja: `${siteUrl}/plays/${play.slug}`,
        en: `${siteUrl}/en/plays/${play.slug}`,
      },
    },
  };
}

export default async function PlayDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) notFound();

  const creditItems = getCreditItems(play.credits);
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "TOP", path: "/" },
    { name: "作品一覧", path: "/plays" },
    { name: play.title, path: `/plays/${play.slug}` },
  ]);
  const castSummary = summarizeCast(play.cast);
  const groupedCast = groupCast(play.cast);
  const hasVod = Boolean(play.vod && Object.keys(play.vod).length > 0);
  const scheduleEntries = parseScheduleEntries(play.period);
  const scheduleSummary = extractPeriodSummary(play.period);
  const scheduleCities = extractScheduleCities(play.period);
  const venueList = splitSlashList(play.venue);
  const compactVenueSummary = summarizeVenues(play.venue);
  const shouldCollapseSchedule = scheduleEntries.length > 2 || venueList.length > 3;
  const shouldShowScheduleDetailToggle =
    (Boolean(play.period) && (shouldCollapseSchedule || scheduleEntries.length > 1)) ||
    (Boolean(play.venue) && (shouldCollapseSchedule || venueList.length > 1));
  const seriesDetail = play.franchiseSlug ? await getSeriesDetailBySlug(play.franchiseSlug) : null;
  const relatedPlays = (seriesDetail?.plays ?? []).filter((item) => item.slug !== play.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: play.title,
    description: toPlainText(play.summary || `${play.title}の公演情報と出演キャストをまとめた作品詳細ページです。`),
    url: `${siteUrl}/plays/${play.slug}`,
    keywords: play.tags.join(", "),
    about: play.franchiseName || undefined,
    actor: play.cast.slice(0, 20).map((item) => ({
      "@type": "Person",
      name: item.name,
      url: `${siteUrl}/actors/${item.slug}`,
    })),
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${play.title}は配信で見られますか？`,
        acceptedAnswer: {
          "@type": "Answer",
          text: hasVod
            ? "配信対応がある場合は、作品詳細ページでDMM TVなどの配信リンクを確認できます。"
            : "現時点では主要な配信情報は確認できていません。DVD・Blu-rayや再演情報もあわせて確認してください。",
        },
      },
      {
        "@type": "Question",
        name: "公演情報やクレジットも見られますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "はい。公演情報、クレジット、出演キャスト、関連シリーズ情報を掲載しています。",
        },
      },
    ],
  };

  return (
    <main className="container works-index-page detail-stage-page play-detail-stage-page" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />

      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "作品一覧", href: "/plays" }]} />

        <section className="hero-card stack-md detail-stage-hero play-detail-stage-hero">
          <div className="play-detail-hero-layout">
            <div className="play-detail-hero-poster" aria-hidden="true">
              <PlayPosterFrame
                title={play.title}
                subtitle={play.franchiseName ?? undefined}
                seed={`${play.slug}-${play.franchiseName ?? ""}`}
              />
            </div>

          <div className="stack-sm detail-ledger-shell play-detail-hero-content">
            {play.franchiseSlug && play.franchiseName ? (
              <Link className="pill series-pill" href={`/series/${play.franchiseSlug}`}>
                シリーズ: {play.franchiseName}
              </Link>
            ) : null}

            <div>
              <h1 className="page-title">{play.title}</h1>
            </div>

            <div className="detail-actions">
              <FavoriteButtonClient slug={play.slug} type="play" size="lg" />
              <ShareButtonClient title={play.title} text={`${play.title}の作品情報 | Stage Connect`} />
            </div>

            {play.tags.length > 0 ? (
              <div className="pill-row">
                {play.tags.map((tag) => (
                  <span className="pill" key={tag}>
                    #{tag}
                  </span>
                ))}
                {hasVod ? <span className="pill accent-pill">配信あり</span> : null}
              </div>
            ) : hasVod ? (
              <div className="pill-row">
                <span className="pill accent-pill">配信あり</span>
              </div>
            ) : null}

            <div className="detail-ledger">
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">出演</span>
                <strong>{play.cast.length}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">シリーズ</span>
                <strong>{play.franchiseName || "単独作品"}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">配信</span>
                <strong>{hasVod ? "配信あり" : "未配信"}</strong>
              </div>
            </div>

            {hasVod ? (
              <div className="play-detail-hero-streaming">
                {play.vod?.dmm ? (
                  <a className="action-button action-button-primary" href={play.vod.dmm} target="_blank" rel="noopener noreferrer">
                    DMM TVで見る
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          </div>
        </section>

        <section className="section-card stack-md detail-stage-section">
          <p className="lead">
            <strong className="strong-inline">{play.title}</strong>
            の配信情報（VOD）と公演データをまとめました。主な出演キャストは
            {castSummary}
            です。
            {hasVod
              ? " 配信ありの場合は、主要リンクから詳細を確認できます。"
              : " 現時点では主要な配信情報は確認中です。DVD・Blu-rayや再演情報もあわせて確認してください。"}
          </p>
        </section>

        <section className="section-card stack-md detail-stage-section">
          <h2 className="section-title">あらすじ</h2>
          <div className="rich-text">{play.summary || "あらすじ情報はまだありません。"}</div>
        </section>

        <section className="section-card stack-md detail-stage-section">
          <h2 className="section-title">公演情報</h2>
          <div className="meta-list roomy">
            {play.period ? (
              <div className="meta-row">
                <div className="meta-label accent-label">日程</div>
                <div className="meta-value">
                  <div>{scheduleSummary || play.period}</div>
                  {scheduleCities.length > 0 ? (
                    <div className="subtle-line">
                      {scheduleCities.length}都市 / {scheduleCities.slice(0, 3).join(" / ")}
                      {scheduleCities.length > 3 ? " / ..." : ""}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {play.venue ? (
              <div className="meta-row">
                <div className="meta-label accent-label">会場</div>
                <div className="meta-value">
                  <div>{compactVenueSummary || play.venue}</div>
                  {venueList.length > 0 ? <div className="subtle-line">{venueList.length}会場</div> : null}
                </div>
              </div>
            ) : null}
            {shouldShowScheduleDetailToggle ? (
              <div className="meta-row">
                <div className="meta-label accent-label">詳細</div>
                <div className="meta-value">
                  <DetailToggleClient summary="詳細を見る">
                    <div className="stack-sm">
                      {play.period ? (
                        <div className="stack-sm">
                          <div className="muted" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            日程
                          </div>
                          <div>{play.period}</div>
                        </div>
                      ) : null}
                      {play.period && play.venue ? <div style={{ height: 12 }} /> : null}
                      {play.venue ? (
                        <div className="stack-sm">
                          <div className="muted" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            会場
                          </div>
                          <div>{play.venue}</div>
                        </div>
                      ) : null}
                    </div>
                  </DetailToggleClient>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {creditItems.length > 0 ? (
          <section className="section-card stack-md detail-stage-section">
            <h2 className="section-title">スタッフ / クレジット</h2>
            <div className="meta-list roomy">
              {creditItems.slice(0, 3).map((item) => (
                <div className="meta-row" key={`${item.role}-${item.names.join("-")}`}>
                  <div className="meta-label accent-label">{item.role}</div>
                  <div className="meta-value">{item.names.join(" / ")}</div>
                </div>
              ))}
            </div>
            {creditItems.length > 3 ? (
              <DetailToggleClient summary={`続きを読む（残り${creditItems.length - 3}項目）`}>
                <div className="meta-list roomy detail-credit-list">
                  {creditItems.slice(3).map((item) => (
                    <div className="meta-row" key={`${item.role}-${item.names.join("-")}`}>
                      <div className="meta-label accent-label">{item.role}</div>
                      <div className="meta-value">{item.names.join(" / ")}</div>
                    </div>
                  ))}
                </div>
              </DetailToggleClient>
            ) : null}
          </section>
        ) : null}

        <section className="section-card stack-md detail-stage-section play-streaming-section">
          <h2 className="section-title">{hasVod ? "配信で見る" : "見る方法を確認"}</h2>
          {hasVod ? (
            <p className="muted">DMM TV など主要な配信リンクを作品ごとに確認できます。</p>
          ) : (
            <p className="muted">現時点では主要な配信情報は確認中です。シリーズ作品や関連作品もあわせて確認してください。</p>
          )}
          <div className="action-row">
            {play.vod?.dmm ? (
              <a className="action-button action-button-primary" href={play.vod.dmm} target="_blank" rel="noopener noreferrer">
                DMM TVで見る
              </a>
            ) : null}
            {play.vod?.unext ? (
              <a className="action-button" href={play.vod.unext} target="_blank" rel="noopener noreferrer">
                U-NEXTで見る
              </a>
            ) : null}
            {play.vod?.danime ? (
              <a className="action-button" href={play.vod.danime} target="_blank" rel="noopener noreferrer">
                dアニメで見る
              </a>
            ) : null}
            <Link className="action-button" href="/watch">
              {hasVod ? "配信ガイドを見る" : "DMMで関連作品を探す"}
            </Link>
            {!hasVod && play.franchiseSlug ? (
              <Link className="action-button" href={`/series/${play.franchiseSlug}`}>
                シリーズ作品を見る
              </Link>
            ) : null}
          </div>
        </section>

        <section className="section-card stack-md detail-stage-section">
          <h2 className="section-title">よくある質問（FAQ）</h2>
          <div className="faq-grid">
            <article className="faq-card">
              <h3 className="faq-question">{play.title}は配信で見られますか？</h3>
              <p className="faq-answer">
                {hasVod
                  ? "配信対応がある場合は、作品詳細ページでDMM TVなどの配信リンクを確認できます。"
                  : "現時点では主要な配信情報は確認中です。DVD・Blu-rayや再演情報もあわせて確認してください。"}
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">公演情報やクレジットも見られますか？</h3>
              <p className="faq-answer">はい。公演情報、クレジット、出演キャスト、関連シリーズ情報を掲載しています。</p>
            </article>
          </div>
        </section>

        <section className="section-card stack-md detail-stage-section">
          <h2 className="section-title">出演キャスト</h2>
          {play.cast.length > 0 ? (
            <div className="stack-md">
              {groupedCast.map((group, index) => (
                <div
                  className={`cast-group-block stack-sm${group.name ? "" : " is-ungrouped"}`}
                  key={group.name ?? `ungrouped-${index}`}
                >
                  <div className="group-chip">{group.name ?? "その他キャスト"}</div>
                  <div className="cast-grid">
                    {group.items.map((item) => (
                      <Link
                        href={`/actors/${item.slug}`}
                        className="cast-card cast-card-link"
                        key={`${item.slug}-${item.roleName ?? "cast"}-${group.name ?? "ungrouped"}`}
                      >
                        <div className="cast-card__monogram" aria-hidden="true">
                          {getCastInitials(item)}
                        </div>
                        <div className="cast-card__body">
                          <div className="cast-name">{item.name}</div>
                          {item.roleName ? <div className="cast-role">{summarizeRoleName(item.roleName)}</div> : null}
                          {item.isStarring ? <div className="cast-badge">MAIN CAST</div> : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">出演キャスト情報はまだありません。</p>
          )}
        </section>

        {relatedPlays.length > 0 ? (
          <section className="section-card stack-md detail-stage-section play-detail-related-section">
            <div className="section-header-inline">
              <h2 className="section-title">同シリーズの作品</h2>
              {play.franchiseSlug ? (
                <Link className="section-link" href={`/series/${play.franchiseSlug}`}>
                  すべて見る
                </Link>
              ) : null}
            </div>
            <div className="play-detail-related-grid">
              {relatedPlays.map((item) => (
                <Link className="play-detail-related-card" href={`/plays/${item.slug}`} key={item.slug}>
                  <div className="play-detail-related-card__poster">
                    <PlayPosterFrame
                      title={item.title}
                      subtitle={play.franchiseName ?? undefined}
                      seed={`${item.slug}-${play.franchiseName ?? ""}`}
                    />
                  </div>
                  <div className="play-detail-related-card__body">
                    <div className="play-detail-related-card__title">{item.title}</div>
                    {item.period ? <div className="play-detail-related-card__meta">{extractPeriodSummary(item.period) || item.period}</div> : null}
                  </div>
                  <span className="play-detail-related-card__arrow">›</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {play.tags.length > 0 ? (
          <section className="section-card stack-md detail-stage-section play-detail-tags-section">
            <h2 className="section-title">関連タグ</h2>
            <div className="play-detail-tag-grid">
              {play.tags.map((tag) => (
                <span className="play-detail-tag" key={tag}>
                  # {tag}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section-card detail-stage-section play-detail-bottom-cta">
          <div>
            <h2 className="section-title">キャストやシリーズ作品もチェック</h2>
            <p className="muted">出演俳優のプロフィールや、同じシリーズの関連作品をご覧いただけます。</p>
          </div>
          <div className="action-row">
            {play.franchiseSlug ? (
              <Link className="action-button action-button-primary" href={`/series/${play.franchiseSlug}`}>
                シリーズを見る
              </Link>
            ) : null}
            <Link className="action-button" href="/actors">
              俳優一覧を見る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
