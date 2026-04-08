import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "2.5次元舞台の配信サービス比較 | Stage Connect（ステコネ）",
  description:
    "DMM TV・U-NEXT・dアニメストアの違いを、2.5次元舞台・ミュージカルの視点で比較する配信ガイドです。",
  alternates: {
    canonical: `${siteUrl}/watch`,
  },
};

export default async function WatchPage() {
  const overview = await getWatchOverview();
  const countLabel = overview.dmmSeriesCount.toLocaleString();

  const faqItems = [
    {
      q: "2.5次元舞台を見るならどの配信サービスが向いていますか？",
      a: `作品数と見放題のバランスで見るなら DMM TV が有力です。Stage Connect では現在 ${countLabel} シリーズを確認していて、月額550円・14日間無料トライアルで始められます。`,
    },
    {
      q: "U-NEXT や dアニメストアとの違いは何ですか？",
      a: "U-NEXT は総合VODとして強く、dアニメストアはアニメ視聴に向いています。2.5次元舞台の配信数や回遊のしやすさでは、現状は DMM TV を軸に考えるのが自然です。",
    },
    {
      q: "Stage Connect では何が分かりますか？",
      a: "作品一覧、シリーズ年表、出演キャスト、配信状況をまとめて確認できます。どのサービスで見るかを決める前に、関連作品やシリーズ全体の流れも追いやすい構成です。",
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
              <span className="breadcrumbs__current">配信ガイド</span>
            </li>
          </ol>
        </nav>

        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Streaming Guide</span>
            <h1 className="page-title">2.5次元舞台の配信サービス比較</h1>
            <p className="lead">
              DMM TV・U-NEXT・dアニメストアを、2.5次元舞台・ミュージカルの視点で比較した配信ガイドです。
              作品数、見放題の条件、向いている使い方をまとめています。
            </p>
          </div>

          <div className="watch-stat-grid">
            <div className="watch-stat-card">
              <div className="watch-stat-label">DMM TVの確認シリーズ</div>
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
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">3サービス比較</h2>
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
                <span className="watch-compare-value is-weak">かなり限定的</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">まずは DMM TV を軸に考える</h2>
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
            2.5次元舞台・ミュージカルの配信数を重視するなら、まずは DMM TV を起点に考えるのが自然です。
            低価格で始めやすく、シリーズページや作品詳細と行き来しながら見たい作品を選びやすいのも強みです。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">サービス別の詳細ガイド</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Recommended</div>
              <Link className="compare-card__title" href="/watch/dmm">
                DMM TVの配信シリーズを詳しく見る
              </Link>
              <div className="compare-card__text">
                {countLabel}シリーズの確認状況、料金、無料トライアル、向いている使い方をまとめています。
              </div>
            </article>

            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/u-next">
                U-NEXTとの違いを比較する
              </Link>
              <div className="compare-card__text">
                総合VODとしての強みと、2.5次元舞台を見るうえでの向き不向きを整理しています。
              </div>
            </article>

            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/danime">
                dアニメストアとの違いを比較する
              </Link>
              <div className="compare-card__text">
                アニメ特化サービスとの違いを、2.5次元舞台の視点で比較しています。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">DMM TVで見られる主なシリーズ</h2>
            <Link className="action-button" href="/watch/dmm">
              一覧を見る
            </Link>
          </div>
          <div className="catalog-grid">
            {overview.dmmTopFranchises.slice(0, 6).map((series) => (
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
