import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActorCoStarsClient } from "../../../components/ActorCoStarsClient";
import {
  formatBirthday,
  getActorDetailBySlug,
  getAgeFromBirthday,
  groupPlayTimelineByYear,
  toPlainText,
  truncate,
} from "../../../lib/stage-connect";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) {
    return {
      title: "俳優が見つかりません | Stage Connect",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = truncate(
    toPlainText(
      actor.profile || `${actor.name}の俳優プロフィールと出演作品をまとめたページです。出演作品数は${actor.plays.length}件です。`
    ),
    150
  );

  return {
    title: `${actor.name} | 俳優詳細 - Stage Connect`,
    description,
    alternates: {
      canonical: `/actors/${actor.slug}`,
    },
  };
}

export default async function ActorDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) notFound();

  const birthdayText = formatBirthday(actor.birthday);
  const age = getAgeFromBirthday(actor.birthday);
  const timeline = groupPlayTimelineByYear(actor.plays);
  const hasSns = Boolean(actor.sns && Object.values(actor.sns).some(Boolean));

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: actor.name,
    alternateName: actor.kana || undefined,
    description: toPlainText(
      actor.profile || `${actor.name}の俳優プロフィールと出演作品をまとめたページです。`
    ),
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
        name: `${actor.name}の出演作はどこで見られますか？`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Stage Connectでは${actor.name}の出演作品を作品ごとにまとめています。出演作品ページで公式データやあらすじを確認できます。`,
        },
      },
      {
        "@type": "Question",
        name: "配信で視聴できる作品はありますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "配信対応の有無は作品ごとに異なります。出演作品詳細ページでDMM TVなどの配信リンクをご確認ください。",
        },
      },
      {
        "@type": "Question",
        name: "最新の出演情報はどこで確認できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: `${actor.name}の公式SNSやオフィシャルサイトで最新情報を確認することをおすすめします。このページの出演作品情報も随時更新しています。`,
        },
      },
    ],
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <div>
              <h1 className="page-title">{actor.name}</h1>
              {actor.kana ? <div className="muted">{actor.kana}</div> : null}
            </div>

            <div className="pill-row">
              {birthdayText ? (
                <span className="pill">
                  生年月日: {birthdayText}
                  {age !== null ? ` (${age}歳)` : ""}
                </span>
              ) : null}
              <span className="pill accent-pill">出演作品数: {actor.plays.length}</span>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">プロフィール</h2>
          <div className="rich-text">
            {actor.profile || `${actor.name}のプロフィール情報はまだありません。`}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">公式リンク</h2>
          {hasSns ? (
            <div className="action-row">
              {actor.sns?.x ? (
                <a className="action-button" href={actor.sns.x} target="_blank" rel="noopener noreferrer">
                  X
                </a>
              ) : null}
              {actor.sns?.instagram ? (
                <a
                  className="action-button"
                  href={actor.sns.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              ) : null}
              {actor.sns?.official ? (
                <a
                  className="action-button action-button-primary"
                  href={actor.sns.official}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Official
                </a>
              ) : null}
              {actor.sns?.youtube ? (
                <a
                  className="action-button"
                  href={actor.sns.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube
                </a>
              ) : null}
            </div>
          ) : (
            <p className="muted">リンク情報はまだありません。</p>
          )}
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">出演作品タイムライン</h2>
          <div className="timeline-shell">
            {timeline.map((group) => (
              <section key={group.year} className="timeline-year-block">
                <div className="timeline-dot" />
                <div className="timeline-year-heading">
                  <span className="timeline-year">{group.year}</span>
                  <span className="timeline-year-sub">YEAR</span>
                </div>

                <div className="cast-grid cast-grid-wide">
                  {group.plays.map((play) => (
                    <article className="cast-card" key={play.slug}>
                      <a className="cast-name" href={`/plays/${play.slug}`}>
                        {play.title}
                      </a>
                      {play.franchiseName ? (
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                          {play.franchiseName}
                        </div>
                      ) : null}
                      {play.roleName ? <div className="cast-role">{play.roleName}</div> : null}
                      {play.period ? (
                        <div className="subtle-line" style={{ marginTop: 10 }}>
                          {play.period}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        {actor.coStars.length > 0 ? <ActorCoStarsClient coStars={actor.coStars} /> : null}

        <section className="section-card stack-md">
          <h2 className="section-title">よくある質問 (FAQ)</h2>
          <div className="faq-grid">
            <article className="faq-card">
              <h3 className="faq-question">Q. {actor.name}の出演作はどこで見られますか？</h3>
              <p className="faq-answer">
                Stage Connectでは{actor.name}
                の出演作品を作品ごとにまとめています。出演作品ページで公式データやあらすじを確認できます。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. 配信で視聴できる作品はありますか？</h3>
              <p className="faq-answer">
                配信対応の有無は作品ごとに異なります。出演作品詳細ページでDMM TVなどの配信リンクをご確認ください。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. 最新の出演情報はどこで確認できますか？</h3>
              <p className="faq-answer">
                {actor.name}
                の公式SNSやオフィシャルサイトで最新情報を確認することをおすすめします。このページの出演作品情報も随時更新しています。
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
