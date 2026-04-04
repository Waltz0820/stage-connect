import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { RelatedSeriesClient } from "../../../components/RelatedSeriesClient";
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

const compactTimelinePeriod = (period?: string | null) => {
  if (!period) return "公演時期未定";

  const slashDate = period.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashDate) {
    const [, year, month] = slashDate;
    return `${year}/${month.padStart(2, "0")}-`;
  }

  const jpDate = period.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (jpDate) {
    const [, year, month] = jpDate;
    return `${year}/${month.padStart(2, "0")}-`;
  }

  const yearMonth = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const [, year, month] = yearMonth;
    return `${year}/${month.padStart(2, "0")}-`;
  }

  const yearOnly = period.match(/(\d{4})/);
  if (yearOnly) {
    return `${yearOnly[1]}-`;
  }

  return period;
};

const hasVod = (vod?: Record<string, string> | null) => Boolean(vod?.dmm || vod?.danime || vod?.unext);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesDetailBySlug(slug);

  if (!series) {
    return {
      title: "シリーズが見つかりません | Stage Connect（ステコネ）",
      robots: { index: false, follow: false },
    };
  }

  const description = truncate(
    toPlainText(
      series.description ||
        `${series.name} のシリーズ一覧と出演キャスト、年表をまとめたページです。作品数は ${series.plays.length} 件です。`
    ),
    150
  );

  return {
    title: `${series.name} | シリーズ詳細 | Stage Connect（ステコネ）`,
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
      series.description || `${series.name} のシリーズ一覧と出演キャストをまとめたページです。`
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
        name: `${series.name} の関連作品はすべて見られますか？`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `現時点で、${series.name} には ${series.plays.length} 作品が登録されています。`,
        },
      },
      {
        "@type": "Question",
        name: "どの順番で見ればよいですか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: `基本的には公開年順に見るのがおすすめです。${startYear ?? "----"}年ごろからの年表順で作品を追えるよう、このページではシリーズ作品を時系列で掲載しています。`,
        },
      },
      {
        "@type": "Question",
        name: "出演キャストも確認できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "はい。シリーズ内で出演回数の多いキャストと役柄を確認できます。気になる俳優がいれば、そのまま俳優詳細ページへ移動できます。",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "シリーズ一覧", href: "/series" }, { label: series.name }]} />
        <section className="hero-card stack-md">
          <div className="stack-sm detail-ledger-shell">
            <h1 className="page-title">{series.name}</h1>
            <div className="pill-row">
              <span className="pill accent-pill">作品数: {series.plays.length}</span>
              {series.originType ? <span className="pill">種別: {series.originType}</span> : null}
            </div>
            <div className="detail-ledger">
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">種別</span>
                <strong>{series.originType || "シリーズ"}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">作品数</span>
                <strong>{series.plays.length}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">開始年</span>
                <strong>{startYear ?? "--"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">シリーズ情報</h2>
          <div className="rich-text">
            {series.description || `${series.name} のシリーズ情報を掲載しています。`}
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
                  <div className="meta-label accent-label">主催・関連</div>
                  <div className="meta-value">{series.productionCompanies.join(" / ")}</div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <SeriesCastOverviewClient topActors={series.topActors} />

        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">年表</h2>
            {startYear ? <span className="pill">{startYear}年〜</span> : null}
          </div>

          <div className="timeline-shell">
            {series.plays.map((play) => (
              <section key={play.slug} className="timeline-year-block">
                <div className="timeline-dot" />
                <div className="timeline-year-heading">
                  <span className="timeline-year">{compactTimelinePeriod(play.period)}</span>
                  <span className="timeline-year-sub">公開時期</span>
                </div>

                <article className="catalog-card">
                  <div className="catalog-card__top">
                    <div>
                      <div className="catalog-card__title">{play.title}</div>
                    </div>
                    {hasVod(play.vod) ? <span className="catalog-card__badge">配信あり</span> : null}
                  </div>

                  {play.summary ? <div className="catalog-card__text catalog-card__text--clamped">{play.summary}</div> : null}

                  <div className="catalog-card__footer">
                    <div className="action-row">
                      <Link className="action-button action-button-primary" href={`/plays/${play.slug}`}>
                        作品詳細を見る
                      </Link>
                      {play.vod?.dmm ? (
                        <a className="action-button" href={play.vod.dmm} target="_blank" rel="noopener noreferrer">
                          DMM TV
                        </a>
                      ) : null}
                      {play.vod?.unext ? (
                        <a className="action-button" href={play.vod.unext} target="_blank" rel="noopener noreferrer">
                          U-NEXT
                        </a>
                      ) : null}
                      {play.vod?.danime ? (
                        <a className="action-button" href={play.vod.danime} target="_blank" rel="noopener noreferrer">
                          dアニメ
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              </section>
            ))}
          </div>
        </section>

        {series.relatedSeries.length > 0 ? (
          <section className="section-card stack-md">
            <div className="section-header-inline">
              <div className="stack-sm">
                <h2 className="section-title">同作品の他シリーズ</h2>
                <p className="catalog-note">同じ作品タイトルで派生・分岐しているシリーズをまとめています。</p>
              </div>
              <span className="pill">{series.relatedSeries.length}件</span>
            </div>
            <RelatedSeriesClient items={series.relatedSeries} />
          </section>
        ) : null}

        <section className="section-card stack-md">
          <h2 className="section-title">よくある質問（FAQ）</h2>
          <div className="faq-grid">
            <article className="faq-card">
              <h3 className="faq-question">Q. {series.name} の関連作品はすべて見られますか？</h3>
              <p className="faq-answer">
                現時点で、{series.name} には {series.plays.length} 作品が登録されています。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. どの順番で見ればよいですか？</h3>
              <p className="faq-answer">
                基本的には公開年順に見るのがおすすめです。{startYear ?? "----"}年ごろからの年表順で作品を追えるよう、
                このページではシリーズ作品を時系列で掲載しています。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. 出演キャストも確認できますか？</h3>
              <p className="faq-answer">
                はい。シリーズ内で出演回数の多いキャストと役柄を確認できます。気になる俳優がいれば、
                そのまま俳優詳細ページへ移動できます。
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
