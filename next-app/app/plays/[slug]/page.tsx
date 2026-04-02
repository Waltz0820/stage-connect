import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButtonClient } from "../../../components/FavoriteButtonClient";
import { ShareButtonClient } from "../../../components/ShareButtonClient";
import {
  getCreditItems,
  getPlayDetailBySlug,
  summarizeCast,
  toPlainText,
  truncate,
} from "../../../lib/stage-connect";

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
    .trim()
    .replace(/(?:再)?凱旋/gu, "")
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
      const colonSplit = entry.split(/[:：]/);
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

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) {
    return {
      title: "作品が見つかりません | Stage Connect",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const castText = summarizeCast(play.cast);
  const description = truncate(
    toPlainText(
      play.summary || `${play.title}の公演データと出演キャスト情報をまとめた作品詳細ページです。主な出演は ${castText} です。`
    ),
    150
  );

  return {
    title: `${play.title}｜キャスト・配信（VOD）・公演情報 - Stage Connect`,
    description,
    alternates: {
      canonical: `/plays/${play.slug}`,
    },
  };
}

export default async function PlayDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) notFound();

  const creditItems = getCreditItems(play.credits);
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
  const visibleCreditItems = creditItems.slice(0, 3);
  const hiddenCreditItems = creditItems.slice(3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: play.title,
    description: toPlainText(
      play.summary || `${play.title}の公演データと出演キャスト情報をまとめた作品詳細ページです。`
    ),
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
    mainEntity: hasVod
      ? [
          {
            "@type": "Question",
            name: `${play.title}はどこで見られますか？`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "DMM TVで配信されている場合があります。見放題対象かレンタルかは作品によって異なりますので、詳細は「配信で見る」セクションからご確認ください。DMMプレミアムなら14日間の無料トライアルがあります。",
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
              text: `主な出演者は${castSummary}です。ページ下部の「出演キャスト」セクションで全キャスト詳細を確認できます。`,
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
              text: `主な出演者は${castSummary}です。ページ下部の「出演キャスト」セクションで全キャスト詳細を確認できます。`,
            },
          },
        ],
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm detail-ledger-shell">
            {play.franchiseSlug && play.franchiseName ? (
              <Link className="pill series-pill" href={`/series/${play.franchiseSlug}`}>
                シリーズ: {play.franchiseName}
              </Link>
            ) : null}

            <div>
              <div className="title-subtle">Stage File</div>
              <h1 className="page-title">{play.title}</h1>
            </div>

            <div className="detail-actions">
              <FavoriteButtonClient
                slug={play.slug}
                type="play"
                size="lg"
                title={play.title}
                franchiseName={play.franchiseName}
              />
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
                <span className="detail-ledger__label">CAST</span>
                <strong>{play.cast.length}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">SERIES</span>
                <strong>{play.franchiseName || "Standalone"}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">VOD</span>
                <strong>{hasVod ? "AVAILABLE" : "NONE"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">INTRODUCTION</h2>
          <p className="lead">
            <strong className="strong-inline">{play.title}</strong>
            の配信情報（VOD）と公演データをまとめました。出演キャストは{castSummary}。
            {hasVod
              ? "視聴できるサービスがある場合は、下記リンクから詳細を確認できます（配信状況は変動する場合があります）。"
              : "現在、主要な配信サービスでの取り扱い情報は確認中ですが、DVD/Blu-ray等で視聴可能な場合があります。"}
          </p>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">あらすじ</h2>
          <div className="rich-text">
            {play.summary || "あらすじ情報はまだありません。"}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">公演情報</h2>
          <div className="meta-list roomy">
            <div className="meta-row">
              <div className="meta-label accent-label">主な出演</div>
              <div className="meta-value">{castSummary}</div>
            </div>

            {play.period ? (
              <div className="meta-row">
                <div className="meta-label accent-label">期間</div>
                <div className="meta-value">
                  <div>{scheduleSummary || play.period}</div>
                  {scheduleCities.length > 0 ? (
                    <div className="subtle-line">
                      {scheduleCities.length}都市 / {scheduleCities.slice(0, 5).join(" / ")}
                      {scheduleCities.length > 5 ? " / ..." : ""}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {play.venue ? (
              <div className="meta-row">
                <div className="meta-label accent-label">劇場</div>
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
                  <details className="detail-block">
                    <summary>詳細を見る</summary>
                    <div className="detail-panel">
                      {play.period ? (
                        <div className="stack-sm">
                          <div className="muted" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            期間
                          </div>
                          <div>{play.period}</div>
                        </div>
                      ) : null}
                      {play.period && play.venue ? <div style={{ height: 12 }} /> : null}
                      {play.venue ? (
                        <div className="stack-sm">
                          <div className="muted" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            劇場
                          </div>
                          <div>{play.venue}</div>
                        </div>
                      ) : null}
                    </div>
                  </details>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {creditItems.length > 0 ? (
          <section className="section-card stack-md">
            <h2 className="section-title">スタッフ / クレジット</h2>
            <div className="meta-list roomy">
              {visibleCreditItems.map((item) => (
                <div className="meta-row" key={`${item.role}-${item.names.join("-")}`}>
                  <div className="meta-label accent-label">{item.role}</div>
                  <div className="meta-value">{item.names.join(" / ")}</div>
                </div>
              ))}
            </div>
            {hiddenCreditItems.length > 0 ? (
              <details className="detail-block">
                <summary>続きを読む（残り{hiddenCreditItems.length}件）</summary>
                <div className="meta-list roomy detail-credit-list">
                  {hiddenCreditItems.map((item) => (
                    <div className="meta-row" key={`${item.role}-${item.names.join("-")}`}>
                      <div className="meta-label accent-label">{item.role}</div>
                      <div className="meta-value">{item.names.join(" / ")}</div>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        ) : null}

        <section className="section-card stack-md">
          <h2 className="section-title">{hasVod ? "配信で見る" : "見る方法を探す"}</h2>
          {hasVod ? (
            <p className="muted">DMMプレミアムなら14日間無料でお試しできます。</p>
          ) : (
            <p className="muted">
              現在この作品の主要配信サービスでの取り扱いは確認中です。シリーズ作品や出演キャストから関連作品を探せます。
            </p>
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
              {hasVod ? "配信ガイドを見る" : "DMMで他作品を探す"}
            </Link>
            {!hasVod && play.franchiseSlug ? (
              <Link className="action-button" href={`/series/${play.franchiseSlug}`}>
                シリーズ作品を見る
              </Link>
            ) : null}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">よくある質問（FAQ）</h2>
          <div className="faq-grid">
            {hasVod ? (
              <>
                <article className="faq-card">
                  <h3 className="faq-question">{play.title}はどこで見られますか？</h3>
                  <p className="faq-answer">
                    DMM TVで配信されている場合があります。見放題対象かレンタルかは作品によって異なりますので、詳細は「配信で見る」セクションからご確認ください。DMMプレミアムなら14日間の無料トライアルがあります。
                  </p>
                </article>
                <article className="faq-card">
                  <h3 className="faq-question">無料で視聴できる期間はありますか？</h3>
                  <p className="faq-answer">
                    DMMプレミアムでは14日間の無料トライアルを提供しています。期間中は対象作品を追加料金なしで視聴できる場合があります。
                  </p>
                </article>
                <article className="faq-card">
                  <h3 className="faq-question">出演キャストは誰ですか？</h3>
                  <p className="faq-answer">
                    主な出演者は{castSummary}です。ページ下部の「出演キャスト」セクションで全キャスト詳細を確認できます。
                  </p>
                </article>
              </>
            ) : (
              <>
                <article className="faq-card">
                  <h3 className="faq-question">{play.title}は現在配信されていますか？</h3>
                  <p className="faq-answer">
                    現在、主要な配信サービスでの取り扱いが確認できない場合があります。古い2.5次元作品はDVD・Blu-ray化や再演で触れられるケースもあります。配信状況は随時確認しています。
                  </p>
                </article>
                <article className="faq-card">
                  <h3 className="faq-question">この作品を見る方法はありますか？</h3>
                  <p className="faq-answer">
                    配信が確認できない場合は、シリーズの他作品や関連作品、DVD・Blu-ray展開、再演情報などをあわせて確認するのがおすすめです。
                  </p>
                </article>
                <article className="faq-card">
                  <h3 className="faq-question">出演キャストは誰ですか？</h3>
                  <p className="faq-answer">
                    主な出演者は{castSummary}です。ページ下部の「出演キャスト」セクションで全キャスト詳細を確認できます。
                  </p>
                </article>
              </>
            )}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">出演キャスト</h2>
          {play.cast.length > 0 ? (
            <div className="stack-md">
              {groupedCast.map((group, index) => (
                <div className="stack-sm" key={group.name ?? `ungrouped-${index}`}>
                  {group.name ? <div className="group-chip">{group.name}</div> : null}
                  <div className="cast-grid">
                    {group.items.map((item) => (
                      <Link
                        href={`/actors/${item.slug}`}
                        className="cast-card cast-card-link"
                        key={`${item.slug}-${item.roleName ?? "cast"}-${group.name ?? "ungrouped"}`}
                      >
                        <div className="cast-name">{item.name}</div>
                        {item.roleName ? <div className="cast-role">{summarizeRoleName(item.roleName)}</div> : null}
                        {item.isStarring ? <div className="cast-badge">MAIN CAST</div> : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">登録されている出演キャストはまだありません。</p>
          )}
        </section>
      </div>
    </main>
  );
}
