import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "dアニメストアで2.5次元舞台は見られる？ | Stage Connect（ステコネ）",
    description:
      "dアニメストアで2.5次元舞台・ミュージカルを見る時の比較ガイドです。DMM TVとの違いや向いている使い方を整理しています。",
    alternates: {
      canonical: `${siteUrl}/watch/danime`,
    },
  };
}

export default async function WatchDanimePage() {
  const overview = await getWatchOverview();
  const dmmCount = overview.dmmSeriesCount.toLocaleString();

  const faqItems = [
    {
      q: "dアニメストアで2.5次元舞台は見られますか？",
      a: "一部作品はありますが、2.5次元舞台・ミュージカルの配信数はかなり限定的です。主目的にするなら DMM TV の方が向いています。",
    },
    {
      q: "dアニメストアと DMM TV の違いは？",
      a: "dアニメストアはアニメ特化で、2.5次元舞台は補助的な位置づけです。DMM TV は2.5次元舞台の配信数とシリーズ導線が強みです。",
    },
    {
      q: "2.5次元舞台を見るならどちらを選ぶべきですか？",
      a: `アニメを主軸にするなら dアニメストア、2.5次元舞台を優先するなら DMM TV が自然です。Stage Connect では DMM TV の確認シリーズ数を ${dmmCount} として案内しています。`,
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
      { "@type": "ListItem", position: 3, name: "dアニメストア", item: `${siteUrl}/watch/danime` },
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
              <span className="breadcrumbs__current">dアニメストア</span>
            </li>
          </ol>
        </nav>

        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">VOD Compare</span>
            <h1 className="page-title">dアニメストアで2.5次元舞台は見られる？</h1>
            <p className="lead">
              dアニメストアはアニメ中心のサービスで、2.5次元舞台・ミュージカルは補助的な扱いです。
              DMM TV と比較しながら、向いている使い方を整理しました。
            </p>
          </div>

          <div className="action-row">
            <a
              className="action-button action-button-primary"
              href={DMM_PREMIUM_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              DMM TVを14日間無料で試す
            </a>
            <Link className="action-button" href="/watch">
              配信ガイドTOPへ
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">dアニメストア vs DMM TV</h2>
          <div className="watch-compare-table">
            <div className="watch-compare-col is-recommended">
              <div className="watch-compare-col__name">
                DMM TV<span className="watch-compare-col__badge">2.5次元向き</span>
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
          <h2 className="section-title">dアニメストアの強みと弱み</h2>
          <div className="prose-panel">
            dアニメストアはアニメ本編や関連コンテンツに強いサービスです。
            その一方で、2.5次元舞台・ミュージカルを主目的にすると配信数は物足りなくなりやすく、シリーズ単位で追うには DMM TV の方が向いています。
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">dアニメの強み</div>
              <div className="compare-card__title">アニメファンとの相性が良い</div>
              <div className="compare-card__text">
                原作アニメを一緒に見たい時や、アニメ中心で使う場合に向いています。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">dアニメの弱み</div>
              <div className="compare-card__title">2.5次元舞台は補助的</div>
              <div className="compare-card__text">
                2.5次元舞台・ミュージカルの配信数では DMM TV に大きく差をつけられています。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">2.5次元舞台を優先するなら DMM TV</h2>
          <div className="prose-panel">
            2.5次元舞台・ミュージカルを中心に見るなら、まずは DMM TV の方が手堅い選択です。
            確認シリーズ数、無料トライアル、回遊のしやすさまで含めて優位があります。
          </div>
          <div className="catalog-summary">
            <span className="catalog-chip">月額550円</span>
            <span className="catalog-chip">14日間無料</span>
            <span className="catalog-chip">確認シリーズ {dmmCount}</span>
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
            <Link className="action-button" href="/watch/dmm">
              DMM TVガイドを見る
            </Link>
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
