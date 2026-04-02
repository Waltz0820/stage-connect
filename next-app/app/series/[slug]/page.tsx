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
  if (roles.length <= 2) return roles.join(" / ");
  return `${roles.slice(0, 2).join(" / ")} / ほか${roles.length - 2}役`;
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
      series.description ||
        `${series.name} のシリーズ詳細ページです。作品一覧、出演キャスト、年表をまとめています。掲載作品数は ${series.plays.length} 件です。`
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
          <div>
            <span className="eyebrow">Series Detail SSR</span>
            <h1 className="page-title">{series.name}</h1>
          </div>
          <p className="lead">
            {series.description ||
              `${series.name} のシリーズ詳細ページです。作品一覧、出演キャスト、年表を初期HTMLで出力する Next.js プロトタイプです。`}
          </p>
          <div className="pill-row">
            <span className="pill">掲載作品数: {series.plays.length}</span>
            {series.originType ? <span className="pill">種別: {series.originType}</span> : null}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Series Info</h2>
          <div className="meta-list">
            {series.originNote ? (
              <div className="meta-item">
                <div className="meta-label">原作・出典</div>
                <div className="meta-value">{series.originNote}</div>
              </div>
            ) : null}
            {series.productionCompanies.length > 0 ? (
              <div className="meta-item">
                <div className="meta-label">制作・関連</div>
                <div className="meta-value">{series.productionCompanies.join(" / ")}</div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">出演キャスト・役柄一覧</h2>
          <div className="cast-list">
            {series.topActors.slice(0, 8).map((item) => (
              <article className="cast-card" key={item.actor.slug}>
                <Link className="cast-name" href={`/actors/${item.actor.slug}`}>
                  {item.actor.name}
                </Link>
                {summarizeGroups(item.groups) ? (
                  <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                    {summarizeGroups(item.groups)}
                  </div>
                ) : null}
                {summarizeRoles(item.roles) ? <div className="cast-role">{summarizeRoles(item.roles)}</div> : null}
                <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                  {item.count}作品に出演
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">作品年表</h2>
          <div className="cast-list">
            {series.plays.map((play) => (
              <article className="cast-card" key={play.slug}>
                <Link className="cast-name" href={`/plays/${play.slug}`}>
                  {play.title}
                </Link>
                {play.period ? (
                  <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
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
