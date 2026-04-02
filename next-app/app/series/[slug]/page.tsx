import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeriesDetailBySlug, toPlainText, truncate } from "../../../lib/stage-connect";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export const revalidate = 3600;
export const dynamicParams = true;

const summarizeRoles = (roles: string[]) => {
  if (roles.length === 0) return null;
  if (roles.length <= 3) return roles.join(" / ");
  return `${roles.slice(0, 3).join(" / ")} / ほか${roles.length - 3}役`;
};

const summarizeGroups = (groups: string[]) => {
  if (groups.length === 0) return null;
  if (groups.length <= 2) return groups.join(" / ");
  return `${groups.slice(0, 2).join(" / ")} / ほか${groups.length - 2}`;
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesDetailBySlug(slug);

  if (!series) {
    return {
      title: "シリーズが見つかりません | Stage Connect",
      robots: { index: false, follow: false },
    };
  }

  const description = truncate(
    toPlainText(
      series.description || `${series.name} のシリーズ作品一覧と出演キャスト、年表をまとめたページです。掲載作品数は ${series.plays.length} 件です。`
    ),
    150
  );

  return {
    title: `${series.name} | シリーズ詳細 - Stage Connect`,
    description,
    alternates: {
      canonical: `/series/${series.slug ?? slug}`,
    },
  };
}

export default async function SeriesDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const series = await getSeriesDetailBySlug(slug);

  if (!series) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: series.name,
    description: toPlainText(series.description || `${series.name} のシリーズ詳細ページです。`),
    url: `${siteUrl}/series/${series.slug ?? slug}`,
    hasPart: series.plays.slice(0, 50).map((play) => ({
      "@type": "CreativeWork",
      name: play.title,
      url: `${siteUrl}/plays/${play.slug}`,
    })),
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <div>
              <h1 className="page-title">{series.name}</h1>
            </div>

            <div className="pill-row">
              <span className="pill accent-pill">作品数: {series.plays.length}</span>
              {series.originType ? <span className="pill">原作: {series.originType}</span> : null}
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Series Info</h2>
          <div className="rich-text">
            {series.description || `${series.name} のシリーズ概要は現在整備中です。`}
          </div>
          {(series.originNote || series.productionCompanies.length > 0) && (
            <div className="meta-list roomy">
              {series.originNote ? (
                <div className="meta-row">
                  <div className="meta-label accent-label">原作・出典</div>
                  <div className="meta-value">{series.originNote}</div>
                </div>
              ) : null}
              {series.productionCompanies.length > 0 ? (
                <div className="meta-row">
                  <div className="meta-label accent-label">制作・関連</div>
                  <div className="meta-value">{series.productionCompanies.join(" / ")}</div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">出演キャスト・役柄一覧</h2>
          {series.topActors.length > 0 ? (
            <div className="cast-grid cast-grid-wide">
              {series.topActors.slice(0, 8).map((item) => (
                <article className="cast-card" key={item.actor.slug}>
                  <Link className="cast-name" href={`/actors/${item.actor.slug}`}>
                    {item.actor.name}
                  </Link>
                  {summarizeGroups(item.groups) ? (
                    <div className="subtle-line" style={{ marginTop: 6 }}>
                      {summarizeGroups(item.groups)}
                    </div>
                  ) : null}
                  {summarizeRoles(item.roles) ? <div className="cast-role">{summarizeRoles(item.roles)}</div> : null}
                  <div className="subtle-line" style={{ marginTop: 10 }}>
                    {item.count}作品に出演
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">出演キャスト情報はまだありません。</p>
          )}
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">年表</h2>
          <div className="cast-grid cast-grid-wide">
            {series.plays.map((play) => (
              <article className="cast-card" key={play.slug}>
                <Link className="cast-name" href={`/plays/${play.slug}`}>
                  {play.title}
                </Link>
                {play.period ? (
                  <div className="subtle-line" style={{ marginTop: 8 }}>
                    {play.period}
                  </div>
                ) : null}
                {play.summary ? <div className="cast-role">{play.summary}</div> : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
