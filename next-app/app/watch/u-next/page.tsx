import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "U-NEXTで2.5次元舞台は見られる？ | Stage Connect（ステコネ）",
    description:
      "U-NEXTで2.5次元舞台・ミュージカルを見る時の比較ガイドです。DMM TVとの違いや向いている使い方を整理しています。",
    alternates: {
      canonical: `${siteUrl}/watch/u-next`,
    },
  };
}

export default async function WatchUNextPage() {
  const overview = await getWatchOverview();
  const dmmCount = overview.dmmSeriesCount.toLocaleString();

  const faqItems = [
    {
      q: "U-NEXTで2.5次元舞台は見られますか？",
      a: "一部の作品は見られますが、ラインナップ全体を見ると DMM TV の方が厚い傾向です。映画やドラマも一緒に見たい人には U-NEXT が向いています。",
    },
    {
      q: "U-NEXT と DMM TV の違いは？",
      a: "U-NEXT は総合VODとして強く、U-NEXTポイントや幅広いジャンルが魅力です。2.5次元舞台の配信数やシリーズ回遊では DMM TV に分があります。",
    },
    {
      q: "結局どちらを選ぶべきですか？",
      a: `2.5次元舞台を優先するなら DMM TV、総合VODとして使うなら U-NEXT が自然です。Stage Connect では DMM TV の確認シリーズ数を ${dmmCount} として案内しています。`,
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
      { "@type": "ListItem", position: 3, name: "U-NEXT", item: `${siteUrl}/watch/u-next` },
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
              <span className="breadcrumbs__current">U-NEXT</span>
            </li>
          </ol>
        </nav>

        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">VOD Compare</span>
            <h1 className="page-title">U-NEXTで2.5次元舞台は見られる？</h1>
            <p className="lead">
              U-NEXT は総合VODとしては強い一方で、2.5次元舞台・ミュージカルの配信数では DMM TV が優勢です。
              どちらが自分に合うかを比較しやすいように整理しました。
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
          <h2 className="section-title">U-NEXT vs DMM TV</h2>
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
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">U-NEXTの強みと弱み</h2>
          <div className="prose-panel">
            U-NEXT は映画、ドラマ、アニメをまとめて楽しみたい人に向いている総合VODです。
            一方で、2.5次元舞台・ミュージカルだけを主目的にするなら、配信数やシリーズ回遊のしやすさでは DMM TV の方が優位です。
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">U-NEXTの強み</div>
              <div className="compare-card__title">総合VODとして使いやすい</div>
              <div className="compare-card__text">
                映画、ドラマ、アニメ、雑誌まで含めて幅広く楽しみたい場合に向いています。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">U-NEXTの弱み</div>
              <div className="compare-card__title">2.5次元舞台は主戦場ではない</div>
              <div className="compare-card__text">
                2.5次元舞台・ミュージカルを優先するなら、作品数の厚みで DMM TV が優勢です。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">2.5次元舞台を優先するなら DMM TV</h2>
          <div className="prose-panel">
            Stage Connect では、2.5次元舞台・ミュージカルを見る入口として DMM TV を推しています。
            確認シリーズ数、料金、無料トライアルのバランスがよく、シリーズ単位で追いやすいからです。
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
