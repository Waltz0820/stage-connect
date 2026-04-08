import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const overview = await getWatchOverview();
  return {
    title: "DMM TVで見られる2.5次元舞台 | Stage Connect（ステコネ）",
    description: `DMM TVで見られる2.5次元舞台・ミュージカルの配信ガイドです。現在 ${overview.dmmSeriesCount.toLocaleString()} シリーズを確認しています。`,
    alternates: {
      canonical: `${siteUrl}/watch/dmm`,
    },
  };
}

export default async function WatchDmmPage() {
  const overview = await getWatchOverview();
  const countLabel = overview.dmmSeriesCount.toLocaleString();

  const faqItems = [
    {
      q: "DMM TVで2.5次元舞台はどれくらい見られますか？",
      a: `Stage Connect では現在 ${countLabel} シリーズを確認しています。無料トライアルと低価格で始めやすく、2.5次元舞台をまとめて追いたい人に向いています。`,
    },
    {
      q: "DMM TVの料金と無料トライアルは？",
      a: "月額550円で、14日間の無料トライアルがあります。まずは関連作品やシリーズを探してから試せるのが使いやすいポイントです。",
    },
    {
      q: "U-NEXT や dアニメストアとの違いは？",
      a: "2.5次元舞台の配信数では DMM TV が強く、シリーズ全体を追いたい場合に向いています。U-NEXT は総合VOD、dアニメストアはアニメ寄りの使い分けになります。",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "配信ガイド", item: `${siteUrl}/watch` },
      { "@type": "ListItem", position: 3, name: "DMM TV", item: `${siteUrl}/watch/dmm` },
    ],
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="stack-lg">
        <nav className="breadcrumbs" aria-label="パンくずリスト">
          <ol className="breadcrumbs__list">
            <li className="breadcrumbs__item">
              <Link className="breadcrumbs__link" href="/">
                ホーム
              </Link>
              <span className="breadcrumbs__divider">/</span>
            </li>
            <li className="breadcrumbs__item">
              <Link className="breadcrumbs__link" href="/watch">
                配信ガイド
              </Link>
              <span className="breadcrumbs__divider">/</span>
            </li>
            <li className="breadcrumbs__item">
              <span className="breadcrumbs__current">DMM TV</span>
            </li>
          </ol>
        </nav>

        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">DMM Premium × Stage Connect</span>
            <h1 className="page-title">2.5次元舞台をDMM TVで見る</h1>
            <p className="lead">
              DMM TV は、2.5次元舞台・ミュージカルをまとめて見たい人に向いている配信サービスです。
              料金、無料トライアル、強みを整理しました。
            </p>
          </div>

          <div className="watch-stat-grid">
            <div className="watch-stat-card">
              <div className="watch-stat-label">確認シリーズ数</div>
              <div className="watch-stat-value">{countLabel}</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">月額料金</div>
              <div className="watch-stat-value">550円</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">無料トライアル</div>
              <div className="watch-stat-value">14日間</div>
            </div>
          </div>

          <div className="action-row">
            <a
              className="action-button action-button-primary"
              href={DMM_PREMIUM_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              14日間無料で試す
            </a>
            <Link className="action-button" href="/watch">
              配信ガイドTOPへ
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">DMM TVが向いている理由</h2>
          <div className="prose-panel">
            2.5次元舞台・ミュージカルの配信数を重視するなら、まずは DMM TV を軸に考えるのが自然です。
            月額550円で始めやすく、見放題で触れられる作品も多いため、シリーズの入口として扱いやすいサービスです。
          </div>
          <div className="catalog-summary">
            <span className="catalog-chip">月額550円</span>
            <span className="catalog-chip">14日間無料</span>
            <span className="catalog-chip">国内最多クラスの配信数</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">他サービスとの比較</h2>
          <div className="watch-compare-table">
            <div className="watch-compare-col is-recommended">
              <div className="watch-compare-col__name">
                DMM TV<span className="watch-compare-col__badge">おすすめ</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">月額</span>
                <span className="watch-compare-value is-strong">550円</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">無料トライアル</span>
                <span className="watch-compare-value is-strong">14日間</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">2.5次元舞台</span>
                <span className="watch-compare-value is-strong">国内最多クラス</span>
              </div>
            </div>

            <div className="watch-compare-col">
              <div className="watch-compare-col__name">U-NEXT</div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">月額</span>
                <span className="watch-compare-value is-weak">2,189円</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">無料トライアル</span>
                <span className="watch-compare-value">31日間</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">2.5次元舞台</span>
                <span className="watch-compare-value is-weak">一部のみ</span>
              </div>
            </div>

            <div className="watch-compare-col">
              <div className="watch-compare-col__name">dアニメストア</div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">月額</span>
                <span className="watch-compare-value">550円</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">無料トライアル</span>
                <span className="watch-compare-value">初月無料</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">2.5次元舞台</span>
                <span className="watch-compare-value is-weak">限定的</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">DMM TVで見られる主なシリーズ</h2>
            <span className="pill accent-pill">{countLabel}シリーズ</span>
          </div>
          <div className="catalog-grid">
            {overview.dmmTopFranchises.map((series) => (
              <article className="catalog-card" key={series.id}>
                <div className="catalog-card__top">
                  <Link className="catalog-card__title" href={series.slug ? `/series/${series.slug}` : "/series"}>
                    {series.name}
                  </Link>
                  <span className="catalog-card__badge">{series.playCount}作品</span>
                </div>
                <div className="catalog-card__footer">
                  <Link className="catalog-link" href={series.slug ? `/series/${series.slug}` : "/series"}>
                    シリーズ詳細を見る
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">まずは無料で試す</h2>
            <a
              className="action-button action-button-primary"
              href={DMM_PREMIUM_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              14日間無料で試す
            </a>
          </div>
          <div className="prose-panel">
            気になるシリーズがあるなら、まずは DMM TV の無料トライアルで配信状況を確認してみるのが手堅いです。
            Stage Connect の作品ページやシリーズページとあわせて使うと、次に見る作品も選びやすくなります。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">よくある質問</h2>
          <div className="faq-grid">
            {faqItems.map((faq) => (
              <article className="faq-card" key={faq.q}>
                <h3 className="faq-question">Q. {faq.q}</h3>
                <p className="faq-answer">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
