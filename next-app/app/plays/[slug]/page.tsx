import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailToggleClient } from "../../../components/DetailToggleClient";
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
  return `${roles.slice(0, 3).join(" / ")} / ほぁE{roles.length - 3}役`;
};

const parseScheduleEntries = (period?: string | null) =>
  String(period ?? "")
    .split(" / ")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeScheduleCity = (city: string) =>
  city
    .trim()
    .replace(/(?:冁E?凱旁Egu, "")
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
      const colonSplit = entry.split(/[:�E�]/);
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
  return `${venues.slice(0, 2).join(" / ")} / ほぁE{venues.length - 2}会場`;
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
      title: "作品が見つかりません | Stage Connect�E�スチE��ネ！E,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const castText = summarizeCast(play.cast);
  const description = truncate(
    toPlainText(
      play.summary || `${play.title}の公演データと出演キャスト情報をまとめた作品詳細ペ�Eジです。主な出演�E ${castText} です。`
    ),
    150
  );

  return {
    title: `${play.title}�E�キャスト�E配信�E�EOD�E��E公演情報 | Stage Connect�E�スチE��ネ）`,
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
      play.summary || `${play.title}の公演データと出演キャスト情報をまとめた作品詳細ペ�Eジです。`
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
            name: `${play.title}はどこで見られますか�E�`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "DMM TVで配信されてぁE��場合があります。見放題対象かレンタルか�E作品によって異なります�Eで、詳細は「�E信で見る」セクションからご確認ください、EMMプレミアムなめE4日間�E無料トライアルがあります、E,
            },
          },
          {
            "@type": "Question",
            name: "無料で視�Eできる期間はありますか�E�E,
            acceptedAnswer: {
              "@type": "Answer",
              text: "DMMプレミアムでは14日間�E無料トライアルを提供してぁE��す。期間中は対象作品を追加料��なしで視�Eできる場合があります、E,
            },
          },
          {
            "@type": "Question",
            name: "出演キャスト�E誰ですか�E�E,
            acceptedAnswer: {
              "@type": "Answer",
              text: `主な出演老E�E${castSummary}です。�Eージ下部の「�E演キャスト」セクションで全キャスト詳細を確認できます。`,
            },
          },
        ].slice(0, 2)
      : [
          {
            "@type": "Question",
            name: `${play.title}は現在配信されてぁE��すか�E�`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "現在、主要な配信サービスでの取り扱ぁE��確認できなぁE��合があります。古ぁE.5次允E��品はDVD・Blu-ray化や再演で触れられるケースもあります。�E信状況�E随時確認してぁE��す、E,
            },
          },
          {
            "@type": "Question",
            name: "こ�E作品を見る方法�Eありますか�E�E,
            acceptedAnswer: {
              "@type": "Answer",
              text: "配信が確認できなぁE��合�E、シリーズの他作品めE��連作品、DVD・Blu-ray展開、�E演情報などをあわせて確認する�Eがおすすめです、E,
            },
          },
          {
            "@type": "Question",
            name: "出演キャスト�E誰ですか�E�E,
            acceptedAnswer: {
              "@type": "Answer",
              text: `主な出演老E�E${castSummary}です。�Eージ下部の「�E演キャスト」セクションで全キャスト詳細を確認できます。`,
            },
          },
        ].slice(0, 2),
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
              <ShareButtonClient title={play.title} text={`${play.title}の作品惁E�� | Stage Connect`} />
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
          <p className="lead">
            <strong className="strong-inline">{play.title}</strong>
            の配信惁E���E�EOD�E�と公演データをまとめました。�E演キャスト�E{castSummary}、E
            {hasVod
              ? "視�Eできるサービスがある場合�E、下記リンクから詳細を確認できます（�E信状況�E変動する場合があります）、E
              : "現在、主要な配信サービスでの取り扱ぁE��報は確認中ですが、DVD/Blu-ray等で視�E可能な場合があります、E}
          </p>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">あらすじ</h2>
          <div className="rich-text">
            {play.summary || "あらすじ惁E��はまだありません、E}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">公演情報</h2>
          <div className="meta-list roomy">
            {play.period ? (
              <div className="meta-row">
                <div className="meta-label accent-label">期間</div>
                <div className="meta-value">
                  <div>{scheduleSummary || play.period}</div>
                  {scheduleCities.length > 0 ? (
                    <div className="subtle-line">
                      {scheduleCities.length}都币E/ {scheduleCities.slice(0, 5).join(" / ")}
                      {scheduleCities.length > 5 ? " / ..." : ""}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {play.venue ? (
              <div className="meta-row">
                <div className="meta-label accent-label">劁E��</div>
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
                            期間
                          </div>
                          <div>{play.period}</div>
                        </div>
                      ) : null}
                      {play.period && play.venue ? <div style={{ height: 12 }} /> : null}
                      {play.venue ? (
                        <div className="stack-sm">
                          <div className="muted" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            劁E��
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
          <section className="section-card stack-md">
            <h2 className="section-title">スタチE�� / クレジチE��</h2>
            <div className="meta-list roomy">
              {visibleCreditItems.map((item) => (
                <div className="meta-row" key={`${item.role}-${item.names.join("-")}`}>
                  <div className="meta-label accent-label">{item.role}</div>
                  <div className="meta-value">{item.names.join(" / ")}</div>
                </div>
              ))}
            </div>
            {hiddenCreditItems.length > 0 ? (
              <DetailToggleClient summary={`続きを読む�E�残り${hiddenCreditItems.length}件�E�`}>
                <div className="meta-list roomy detail-credit-list">
                  {hiddenCreditItems.map((item) => (
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

        <section className="section-card stack-md">
          <h2 className="section-title">{hasVod ? "配信で見る" : "見る方法を探ぁE}</h2>
          {hasVod ? (
            <p className="muted">DMMプレミアムなめE4日間無料でお試しできます、E/p>
          ) : (
            <p className="muted">
              現在こ�E作品の主要E�E信サービスでの取り扱ぁE�E確認中です。シリーズ作品めE�E演キャストから関連作品を探せます、E
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
              {hasVod ? "配信ガイドを見る" : "DMMで他作品を探ぁE}
            </Link>
            {!hasVod && play.franchiseSlug ? (
              <Link className="action-button" href={`/series/${play.franchiseSlug}`}>
                シリーズ作品を見る
              </Link>
            ) : null}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">よくある質問！EAQ�E�E/h2>
          <div className="faq-grid">
            {hasVod ? (
              <>
                <article className="faq-card">
                  <h3 className="faq-question">{play.title}はどこで見られますか�E�E/h3>
                  <p className="faq-answer">
                    DMM TVで配信されてぁE��場合があります。見放題対象かレンタルか�E作品によって異なります�Eで、詳細は「�E信で見る」セクションからご確認ください、EMMプレミアムなめE4日間�E無料トライアルがあります、E
                  </p>
                </article>
                <article className="faq-card">
                  <h3 className="faq-question">無料で視�Eできる期間はありますか�E�E/h3>
                  <p className="faq-answer">
                    DMMプレミアムでは14日間�E無料トライアルを提供してぁE��す。期間中は対象作品を追加料��なしで視�Eできる場合があります、E
                  </p>
                </article>
              </>
            ) : (
              <>
                <article className="faq-card">
                  <h3 className="faq-question">{play.title}は現在配信されてぁE��すか�E�E/h3>
                  <p className="faq-answer">
                    現在、主要な配信サービスでの取り扱ぁE��確認できなぁE��合があります。古ぁE.5次允E��品はDVD・Blu-ray化や再演で触れられるケースもあります。�E信状況�E随時確認してぁE��す、E
                  </p>
                </article>
                <article className="faq-card">
                  <h3 className="faq-question">こ�E作品を見る方法�Eありますか�E�E/h3>
                  <p className="faq-answer">
                    配信が確認できなぁE��合�E、シリーズの他作品めE��連作品、DVD・Blu-ray展開、�E演情報などをあわせて確認する�Eがおすすめです、E
                  </p>
                </article>
              </>
            )}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">出演キャスチE/h2>
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
            <p className="muted">登録されてぁE��出演キャスト�Eまだありません、E/p>
          )}
        </section>
      </div>
    </main>
  );
}
