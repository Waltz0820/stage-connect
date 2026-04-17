import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../../components/Breadcrumbs";
import { DetailToggleClient } from "../../../../components/DetailToggleClient";
import { StructuredData } from "../../../../components/StructuredData";
import {
  compactListPeriodEn,
  getEnglishActorName,
  getEnglishPlayTitle,
  getEnglishSeriesName,
  normalizePeriodDisplayEn,
  translateAnnotatedDisplayTextEn,
  translateDisplayTextEn,
  truncateText,
} from "../../../../lib/en-copy";
import { buildBreadcrumbList } from "../../../../lib/structured-data";
import { getCreditItems, getPlayDetailBySlug, toPlainText } from "../../../../lib/stage-connect";

type Params = { slug: string };
type GroupedCast = {
  name: string | null;
  items: Array<{
    slug: string;
    name: string;
    nameEn?: string | null;
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

const summarizeCastEn = (
  cast: Array<{
    slug?: string | null;
    name?: string | null;
    nameEn?: string | null;
  }>
) => {
  const names = Array.from(
    new Set(
      cast
        .map((item) => getEnglishActorName(item))
        .map((name) => name.trim())
        .filter(Boolean)
    )
  );

  if (names.length === 0) return "cast not listed yet";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")}, and more`;
};

const summarizeRoleNameEn = (value?: string | null) => {
  const roles = splitSlashList(value);
  if (roles.length <= 3) return value ?? null;
  return `${roles.slice(0, 3).join(" / ")} / ${roles.length - 3} more`;
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
    .replace(/[:：]\s*$/u, "")
    .replace(/\s+/gu, " ")
    .replace(/(?:公演|会場)$/u, "")
    .trim();

const extractScheduleCitiesEn = (period?: string | null) => {
  const cities = parseScheduleEntries(period)
    .map((entry) => {
      const colonSplit = entry.split(/[:：]/);
      if (colonSplit.length > 1) return normalizeScheduleCity(colonSplit[0]);
      const direct = entry.match(/^([^\d]+?)\s+\d{4}\s*\/\s*\d{1,2}/);
      return direct ? normalizeScheduleCity(direct[1]) : "";
    })
    .filter(Boolean)
    .map((city) => translateAnnotatedDisplayTextEn(city));

  return Array.from(new Set(cities));
};

const groupCast = (
  cast: Array<{
    slug: string;
    name: string;
    nameEn?: string | null;
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
        nameEn: item.nameEn,
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

const buildPlayMetaDescriptionEn = (play: NonNullable<Awaited<ReturnType<typeof getPlayDetailBySlug>>>) => {
  const displayTitle = getEnglishPlayTitle(play);
  const parts: string[] = [];
  const displaySeriesName = play.franchiseName
    ? getEnglishSeriesName({ name: play.franchiseName, nameEn: play.franchiseNameEn })
    : null;
  const summary = toPlainText(play.summaryEn || play.summary || "").trim().replace(/[.。]\s*$/u, "");

  if (summary) parts.push(`${summary}.`);

  const factParts: string[] = [];
  if (displaySeriesName) factParts.push(`Series: ${displaySeriesName}`);
  if (play.cast.length > 0) factParts.push(`Cast: ${play.cast.length}`);
  if (play.vod && Object.keys(play.vod).length > 0) factParts.push("Streaming available");
  if (factParts.length > 0) parts.push(`${factParts.join(" / ")}.`);

  if (parts.length === 0) {
    parts.push(`${displayTitle} cast, series, and streaming archive page on Stage Connect.`);
  } else {
    parts.push("Includes cast, credits, and schedule details.");
  }

  return truncateText(parts.join(" "), 150);
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) {
    return {
      title: "Play not found | Stage Connect",
      robots: { index: false, follow: false },
    };
  }

  const displayTitle = getEnglishPlayTitle(play);

  return {
    title: `${displayTitle} | Cast, series, and streaming info | Stage Connect`,
    description: buildPlayMetaDescriptionEn(play),
    alternates: {
      canonical: `${siteUrl}/en/plays/${play.slug}`,
      languages: {
        ja: `${siteUrl}/plays/${play.slug}`,
        en: `${siteUrl}/en/plays/${play.slug}`,
      },
    },
  };
}

export default async function EnglishPlayDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) notFound();

  const displayTitle = getEnglishPlayTitle(play);
  const creditItems = getCreditItems(play.credits);
  const castSummary = summarizeCastEn(play.cast);
  const hasVod = Boolean(play.vod && Object.keys(play.vod).length > 0);
  const venues = splitSlashList(play.venue);
  const translatedVenues = venues.map((item) => translateAnnotatedDisplayTextEn(item));
  const translatedPeriod = normalizePeriodDisplayEn(translateAnnotatedDisplayTextEn(play.period));
  const scheduleCities = extractScheduleCitiesEn(play.period);
  const groupedCast = groupCast(play.cast);
  const shouldShowPublicInfoDetail = Boolean(play.period || play.venue);
  const synopsis = play.summaryEn || translateDisplayTextEn(play.summary);
  const displaySeriesName = play.franchiseName
    ? getEnglishSeriesName({ name: play.franchiseName, nameEn: play.franchiseNameEn })
    : null;
  const creativeWorkJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: displayTitle,
    description: toPlainText(
      synopsis || `${displayTitle} cast and production archive page on Stage Connect.`
    ),
    url: `${siteUrl}/en/plays/${play.slug}`,
    keywords: play.tags.join(", "),
    about: displaySeriesName || undefined,
    actor: play.cast.slice(0, 20).map((item) => ({
      "@type": "Person",
      name: getEnglishActorName(item),
      url: `${siteUrl}/en/actors/${item.slug}`,
    })),
  };
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "HOME", path: "/en" },
    { name: "Plays", path: "/en/plays" },
    { name: displayTitle, path: `/en/plays/${play.slug}` },
  ]);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={creativeWorkJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Plays", href: "/en/plays" }]} />

        <section className="hero-card stack-md">
          <div className="stack-sm detail-ledger-shell">
            {play.franchiseSlug && displaySeriesName ? (
              <Link className="pill series-pill" href={`/en/series/${play.franchiseSlug}`}>
                Series: {displaySeriesName}
              </Link>
            ) : null}

            <h1 className="page-title">{displayTitle}</h1>

            <div className="pill-row">
              {play.tags.map((tag) => (
                <span className="pill" key={tag}>
                  #{tag}
                </span>
              ))}
              {hasVod ? <span className="pill accent-pill">Streaming available</span> : null}
            </div>

            <div className="detail-ledger">
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">Cast</span>
                <strong>{play.cast.length}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">Series</span>
                <strong>{displaySeriesName || "Standalone"}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">Streaming</span>
                <strong>{hasVod ? "Available" : "Unavailable"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <p className="lead">
            <strong className="strong-inline">{displayTitle}</strong> is listed with cast, series connection, public
            schedule, venue, and streaming availability. Featured cast includes {castSummary}.
          </p>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Synopsis</h2>
          <div className="rich-text">{synopsis || "Synopsis not available yet."}</div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Public information</h2>
          <div className="meta-list roomy">
            {play.period ? (
              <div className="meta-row">
                <div className="meta-label accent-label">Schedule</div>
                <div className="meta-value">
                  <div>{compactListPeriodEn(play.period) || translatedPeriod || play.period}</div>
                  {scheduleCities.length > 0 ? (
                    <div className="subtle-line">
                      {scheduleCities.length} cities / {scheduleCities.slice(0, 3).join(" / ")}
                      {scheduleCities.length > 3 ? " / ..." : ""}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {play.venue ? (
              <div className="meta-row">
                <div className="meta-label accent-label">Venues</div>
                <div className="meta-value">
                  <div>{translatedVenues.slice(0, 3).join(" / ")}</div>
                  {translatedVenues.length > 3 ? (
                    <div className="subtle-line">and {translatedVenues.length - 3} more venues</div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {shouldShowPublicInfoDetail ? (
              <div className="meta-row">
                <div className="meta-label accent-label">Details</div>
                <div className="meta-value">
                  <DetailToggleClient summary="View details">
                    <div className="stack-sm">
                      {play.period ? (
                        <div className="stack-sm">
                          <div className="muted" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            Schedule
                          </div>
                          <div>{translatedPeriod || play.period}</div>
                        </div>
                      ) : null}
                      {play.period && play.venue ? <div style={{ height: 12 }} /> : null}
                      {play.venue ? (
                        <div className="stack-sm">
                          <div className="muted" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            Venues
                          </div>
                          <div>{translatedVenues.join(" / ") || play.venue}</div>
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
          <section className="section-card stack-md">
            <h2 className="section-title">Credits</h2>
            <div className="meta-list roomy">
              {creditItems.slice(0, 6).map((item) => (
                <div className="meta-row" key={`${item.role}-${item.names.join("-")}`}>
                  <div className="meta-label accent-label">{translateDisplayTextEn(item.role)}</div>
                  <div className="meta-value">{item.names.map((name) => translateDisplayTextEn(name)).join(" / ")}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section-card stack-md">
          <h2 className="section-title">Streaming</h2>
          <p className="muted">
            {hasVod
              ? "This production currently has streaming availability listed on Stage Connect."
              : "No streaming platform is listed for this production at the moment."}
          </p>
          <div className="action-row">
            {play.vod?.dmm ? (
              <a className="action-button action-button-primary" href={play.vod.dmm} target="_blank" rel="noopener noreferrer">
                Watch on DMM TV
              </a>
            ) : null}
            {play.vod?.unext ? (
              <a className="action-button" href={play.vod.unext} target="_blank" rel="noopener noreferrer">
                Watch on U-NEXT
              </a>
            ) : null}
            {play.vod?.danime ? (
              <a className="action-button" href={play.vod.danime} target="_blank" rel="noopener noreferrer">
                Watch on d Anime Store
              </a>
            ) : null}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Cast</h2>
          {play.cast.length > 0 ? (
            <div className="stack-md">
              {groupedCast.map((group, index) => (
                <div
                  className={`cast-group-block stack-sm${group.name ? "" : " is-ungrouped"}`}
                  key={group.name ?? `ungrouped-${index}`}
                >
                  <div className="group-chip">
                    {group.name ? translateAnnotatedDisplayTextEn(group.name) : "Additional cast"}
                  </div>
                  <div className="cast-grid">
                    {group.items.map((item) => (
                      <Link
                        href={`/en/actors/${item.slug}`}
                        className="cast-card cast-card-link"
                        key={`${item.slug}-${item.roleName ?? "cast"}-${group.name ?? "ungrouped"}`}
                      >
                        <div className="cast-name">{getEnglishActorName(item)}</div>
                        {item.roleName ? (
                          <div className="cast-role">{summarizeRoleNameEn(translateAnnotatedDisplayTextEn(item.roleName))}</div>
                        ) : null}
                        {item.isStarring ? <div className="cast-badge">MAIN CAST</div> : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Cast information is not available yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
