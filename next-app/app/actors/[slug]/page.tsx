import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
      actor.profile ||
        `${actor.name} の俳優プロフィールと出演作品をまとめたページです。掲載作品数は ${actor.plays.length} 件です。`
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: actor.name,
    alternateName: actor.kana || undefined,
    description: toPlainText(actor.profile || `${actor.name} の俳優プロフィールページです。`),
    url: `${siteUrl}/actors/${actor.slug}`,
    birthDate: actor.birthday || undefined,
    sameAs: Object.values(actor.sns || {}).filter(Boolean),
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Actor Detail SSR</span>
            <h1 className="page-title">{actor.name}</h1>
            {actor.kana ? <div className="muted">{actor.kana}</div> : null}
          </div>
          <p className="lead">
            {actor.profile ||
              `${actor.name} の俳優プロフィールと出演作品をまとめたページです。初期HTMLで年表と関連作品リンクを出力します。`}
          </p>
          <div className="pill-row">
            {birthdayText ? (
              <span className="pill">
                生年月日: {birthdayText}
                {age !== null ? ` (${age}歳)` : ""}
              </span>
            ) : null}
            <span className="pill">出演作品数: {actor.plays.length}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">公式リンク</h2>
          <div className="inline-links">
            {actor.sns?.x ? (
              <a className="inline-link" href={actor.sns.x} target="_blank" rel="noopener noreferrer">
                X
              </a>
            ) : null}
            {actor.sns?.instagram ? (
              <a className="inline-link" href={actor.sns.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            ) : null}
            {actor.sns?.official ? (
              <a className="inline-link" href={actor.sns.official} target="_blank" rel="noopener noreferrer">
                Official
              </a>
            ) : null}
            {actor.sns?.youtube ? (
              <a className="inline-link" href={actor.sns.youtube} target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            ) : null}
            <Link className="inline-link" href="/actors">
              俳優一覧へ戻る
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">出演年表</h2>
          <div className="stack-lg">
            {timeline.map((group) => (
              <section key={group.year} className="stack-md">
                <div className="meta-label mono">{group.year}</div>
                <div className="cast-list">
                  {group.plays.map((play) => (
                    <article className="cast-card" key={play.slug}>
                      <Link className="cast-name" href={`/plays/${play.slug}`}>
                        {play.title}
                      </Link>
                      {play.franchiseName ? (
                        <div className="muted" style={{ marginTop: 4 }}>
                          {play.franchiseName}
                        </div>
                      ) : null}
                      {play.roleName ? <div className="cast-role">{play.roleName}</div> : null}
                      {play.period ? (
                        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
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
      </div>
    </main>
  );
}
