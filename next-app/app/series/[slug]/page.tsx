import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeriesCastOverviewClient } from "../../../components/SeriesCastOverviewClient";
import { getSeriesDetailBySlug, toPlainText, truncate } from "../../../lib/stage-connect";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;
export const dynamicParams = true;

const getStartYear = (periods: Array<string | null>) => {
  const years = periods
    .map((period) => String(period ?? "").match(/(\d{4})/)?.[1])
    .filter(Boolean)
    .map((year) => Number(year));

  if (years.length === 0) return null;
  return Math.min(...years);
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
        `${series.name}のシリーズ作品一覧と出演キャスト、年表をまとめたページです。収録作品数は${series.plays.length}件です。`
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

  const startYear = getStartYear(series.plays.map((play) => play.period));

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: series.name,
    description: toPlainText(
      series.description || `${series.name}のシリーズ作品一覧と出演キャストをまとめたページです。`
    ),
    url: `${siteUrl}/series/${series.slug ?? slug}`,
    hasPart: series.plays.slice(0, 50).map((play) => ({
      "@type": "CreativeWork",
      name: play.title,
      url: `${siteUrl}/plays/${play.slug}`,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${series.name}の関連作品は全部で何作ありますか？`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `現在、${series.name}には${series.plays.length}作品が登録されています。`,
        },
      },
      {
        "@type": "Question",
        name: "どの順番で見ればいいですか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: `基本的には公開年順に見るのがおすすめです。${startYear ?? "----"}年頃からの年表順に作品を追えるよう、このページではシリーズ作品を整理しています。`,
        },
      },
      {
        "@type": "Question",
        name: "出演キャストも確認できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "はい。シリーズ配下の作品に出ている俳優と役柄を集約して確認できます。気になる俳優がいれば、そのまま俳優詳細ページへ移動できます。",
        },
      },
    ],
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
            {series.description || `${series.name}のシリーズ説明は現在準備中です。`}
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
                  <div className="meta-label accent-label">製作・関連</div>
                  <div className="meta-value">{series.productionCompanies.join(" / ")}</div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <SeriesCastOverviewClient topActors={series.topActors} />

        <section className="section-card stack-md">
          <h2 className="section-title">年表</h2>
          <div className="cast-grid cast-grid-wide">
            {series.plays.map((play) => (
              <article className="cast-card" key={play.slug}>
                <a className="cast-name" href={`/plays/${play.slug}`}>
                  {play.title}
                </a>
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

        <section className="section-card stack-md">
          <h2 className="section-title">よくある質問 (FAQ)</h2>
          <div className="faq-grid">
            <article className="faq-card">
              <h3 className="faq-question">Q. {series.name}の関連作品は全部で何作ありますか？</h3>
              <p className="faq-answer">
                現在、{series.name}には{series.plays.length}作品が登録されています。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. どの順番で見ればいいですか？</h3>
              <p className="faq-answer">
                基本的には公開年順に見るのがおすすめです。{startYear ?? "----"}年頃からの年表順に作品を追えるよう、このページではシリーズ作品を整理しています。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. 出演キャストも確認できますか？</h3>
              <p className="faq-answer">
                はい。シリーズ配下の作品に出ている俳優と役柄を集約して確認できます。気になる俳優がいれば、そのまま俳優詳細ページへ移動できます。
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
