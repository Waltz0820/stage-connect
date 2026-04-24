import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActorCoStarsClient } from "../../../components/ActorCoStarsClient";
import { ActorTopSeriesClient } from "../../../components/ActorTopSeriesClient";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { FavoriteButtonClient } from "../../../components/FavoriteButtonClient";
import { ShareButtonClient } from "../../../components/ShareButtonClient";
import { StructuredData } from "../../../components/StructuredData";
import {
  getActorDetailBySlug,
  getAgeFromBirthday,
  getDisplayBirthday,
  groupPlayTimelineByYear,
  toPlainText,
  truncate,
} from "../../../lib/stage-connect";
import { buildBreadcrumbList } from "../../../lib/structured-data";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;
export const dynamicParams = true;

const buildActorMetaDescriptionJa = (actor: NonNullable<Awaited<ReturnType<typeof getActorDetailBySlug>>>) => {
  const parts: string[] = [];
  const statusLine = toPlainText(actor.profile || "").trim().replace(/[。．]\s*$/u, "");

  if (statusLine) parts.push(`${statusLine}。`);

  const factParts: string[] = [];
  if (actor.heightCm !== null) factParts.push(`身長${actor.heightCm}cm`);
  if (actor.bloodType) factParts.push(`血液型${actor.bloodType}型`);
  if (factParts.length > 0) parts.push(`${factParts.join("、")}。`);

  if (actor.topSeries.length > 0) {
    const topNames = actor.topSeries.slice(0, 2).map((item) => `『${item.name}』`);
    parts.push(`主な出演シリーズは${topNames.join("など")}。`);
  }

  parts.push(`出演作品数は${actor.plays.length}作。出演年表と共演情報を掲載。`);
  return truncate(parts.join(" "), 150);
};

const formatTimelineLeadDate = (period?: string | null) => {
  const value = String(period ?? "").trim();
  if (!value) return null;

  const fullDate = value.match(/(\d{4})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
  if (fullDate) {
    const [, year, month, day] = fullDate;
    return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}-`;
  }

  const yearMonth = value.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const [, year, month] = yearMonth;
    return `${year}/${month.padStart(2, "0")}-`;
  }

  const yearOnly = value.match(/(\d{4})/);
  if (yearOnly) return `${yearOnly[1]}-`;

  return value;
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) {
    return {
      title: "俳優が見つかりません | Stage Connect（ステコネ）",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${actor.name} | 俳優詳細 | Stage Connect（ステコネ）`,
    description: buildActorMetaDescriptionJa(actor),
    alternates: {
      canonical: `${siteUrl}/actors/${actor.slug}`,
      languages: {
        ja: `${siteUrl}/actors/${actor.slug}`,
        en: `${siteUrl}/en/actors/${actor.slug}`,
      },
    },
  };
}

export default async function ActorDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) notFound();

  const birthdayText = getDisplayBirthday(actor.birthday, actor.birthdayLabel);
  const age = getAgeFromBirthday(actor.birthday, actor.deathDate);
  const timeline = groupPlayTimelineByYear(actor.plays);
  const hasSns = Boolean(actor.sns && Object.values(actor.sns).some(Boolean));
  const statusLine = toPlainText(actor.profile || "") || `${actor.name}のプロフィール情報はまだありません。`;

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: actor.name,
    alternateName: actor.kana || undefined,
    description: statusLine,
    url: `${siteUrl}/actors/${actor.slug}`,
    birthDate: actor.birthday || undefined,
    sameAs: Object.values(actor.sns || {}).filter(Boolean),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${actor.name}の出演作品はどこで見られますか？`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Stage Connectでは${actor.name}の出演作品を年表順にまとめています。出演作品タイムラインから関連する作品ページへ移動できます。`,
        },
      },
      {
        "@type": "Question",
        name: "配信で見られる作品はありますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "配信対応の作品は作品詳細ページに掲載しています。作品ページでDMM TVなどの配信リンクを確認できます。",
        },
      },
      {
        "@type": "Question",
        name: "最新の出演情報はどこで確認できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: `${actor.name}の公式SNSや公式サイトで最新情報を確認できます。このページの公式リンクから移動できます。`,
        },
      },
    ],
  };

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "TOP", path: "/" },
    { name: "俳優一覧", path: "/actors" },
    { name: actor.name, path: `/actors/${actor.slug}` },
  ]);

  return (
    <main className="container works-index-page detail-stage-page actor-detail-stage-page" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={personJsonLd} />
      <StructuredData data={faqJsonLd} />

      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "俳優一覧", href: "/actors" }]} />

        <section className="hero-card stack-md detail-stage-hero">
          <div className="detail-hero-grid">
            <div className="detail-monogram" aria-hidden="true">
              {actor.name.trim().charAt(0)}
            </div>

            <div className="detail-hero-copy">
              <h1 className="page-title">{actor.name}</h1>
              {actor.kana ? <div className="muted">{actor.kana}</div> : null}
              <p className="detail-status-line">{statusLine}</p>
            </div>

            <div className="detail-actions">
              <FavoriteButtonClient slug={actor.slug} type="actor" size="lg" name={actor.name} kana={actor.kana} />
              <ShareButtonClient title={actor.name} text={`${actor.name}の俳優プロフィール | Stage Connect`} />
            </div>

            <div className="pill-row">
              {birthdayText ? (
                <span className="pill">
                  生年月日: {birthdayText}
                  {age !== null ? ` (${age}歳)` : ""}
                </span>
              ) : null}
              {actor.heightCm !== null ? <span className="pill">身長: {actor.heightCm}cm</span> : null}
              {actor.bloodType ? <span className="pill">血液型: {actor.bloodType}</span> : null}
              <span className="pill accent-pill">出演作品数: {actor.plays.length}</span>
            </div>
          </div>
        </section>

        {actor.topSeries.length > 0 ? <ActorTopSeriesClient items={actor.topSeries} /> : null}

        <section className="section-card stack-md detail-stage-section">
          <h2 className="section-title">出演作品タイムライン</h2>
          <div className="timeline-shell">
            {timeline.map((group) => (
              <section key={group.year} className="timeline-year-block">
                <div className="timeline-dot" />
                <div className="timeline-year-heading">
                  <span className="timeline-year">{group.year}</span>
                  <span className="timeline-year-sub">公開年</span>
                </div>

                <div className="actor-timeline-list">
                  {group.plays.map((play) => (
                    <article className="catalog-card actor-timeline-card" key={play.slug}>
                      <Link className="catalog-card__body-link actor-timeline-card__link" href={`/plays/${play.slug}`}>
                        <div className="actor-timeline-card__body">
                          <div className="cast-name">{play.title}</div>
                          {play.franchiseName ? <div className="actor-timeline-card__series">{play.franchiseName}</div> : null}
                          {play.roleName ? <div className="cast-role">{play.roleName}</div> : null}
                          {formatTimelineLeadDate(play.period) ? (
                            <div className="subtle-line" style={{ marginTop: 10 }}>
                              {formatTimelineLeadDate(play.period)}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                      <div
                        className={`catalog-card__footer catalog-card__footer--cta${play.vod?.dmm ? "" : " is-empty"}`}
                      >
                        {play.vod?.dmm ? (
                          <a
                            className="action-button action-button-primary action-button-inline"
                            href={play.vod.dmm}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            DMM TVで見る
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        {actor.coStars.length > 0 ? <ActorCoStarsClient coStars={actor.coStars} /> : null}

        <section className="section-card stack-md detail-stage-section">
          <h2 className="section-title">公式リンク</h2>
          {hasSns ? (
            <div className="action-row">
              {actor.sns?.x ? (
                <a className="action-button" href={actor.sns.x} target="_blank" rel="noopener noreferrer">
                  X
                </a>
              ) : null}
              {actor.sns?.instagram ? (
                <a className="action-button" href={actor.sns.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              ) : null}
              {actor.sns?.official ? (
                <a className="action-button action-button-primary" href={actor.sns.official} target="_blank" rel="noopener noreferrer">
                  公式サイト
                </a>
              ) : null}
              {actor.sns?.youtube ? (
                <a className="action-button" href={actor.sns.youtube} target="_blank" rel="noopener noreferrer">
                  YouTube
                </a>
              ) : null}
            </div>
          ) : (
            <p className="muted">リンク情報はまだありません。</p>
          )}
        </section>

        <section className="section-card stack-md detail-stage-section">
          <h2 className="section-title">よくある質問（FAQ）</h2>
          <div className="faq-grid">
            <article className="faq-card">
              <h3 className="faq-question">Q. {actor.name}の出演作品はどこで見られますか？</h3>
              <p className="faq-answer">
                Stage Connectでは{actor.name}の出演作品を年表順にまとめています。出演作品タイムラインから関連する作品ページへ移動できます。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. 配信で見られる作品はありますか？</h3>
              <p className="faq-answer">
                配信対応の作品は作品詳細ページに掲載しています。作品ページでDMM TVなどの配信リンクを確認できます。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. 最新の出演情報はどこで確認できますか？</h3>
              <p className="faq-answer">
                {actor.name}の公式SNSや公式サイトで最新情報を確認できます。このページの公式リンクから移動できます。
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
