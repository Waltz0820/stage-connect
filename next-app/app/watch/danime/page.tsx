import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "dアニメストアで2.5次元舞台は見られる？DMM TVとの比較ガイド | Stage Connect（ステコネ）",
    description:
      "dアニメストアで2.5次元舞台・ミュージカルを見たい人向けの比較ガイド。料金・無料トライアル・2.5次元の充実度をDMM TVと比較。アニメ特化サービスの強みと限界を整理しています。",
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
      a: "一部は見られますが、2.5次元舞台の掲載数は限定的です。2.5次元舞台を主目的にするなら、DMM TVの方がラインナップが充実しています。",
    },
    {
      q: "dアニメストアとDMM TVはどう違いますか？",
      a: `dアニメストアはアニメ特化、DMM TVは2.5次元舞台を含む幅広いジャンルをカバー。2.5次元舞台の見放題シリーズ数はDMM TVが${dmmCount}件確認済みで優位です。`,
    },
    {
      q: "dアニメストアとDMM TVの料金は？",
      a: "どちらも月額550円（税込）で同額です。同じ料金なら、2.5次元舞台の見放題が充実しているDMM TVの方がコスパが高いと言えます。",
    },
    {
      q: "2.5次元舞台を見るのにdアニメストアは向いていますか？",
      a: "アニメ中心で、2.5次元舞台は補助的に見る程度なら選択肢に入ります。ただし2.5次元を主目的にするなら、DMM TVを先に確認した方が効率的です。",
    },
    {
      q: "dアニメストアの無料トライアルで2.5次元舞台を見られますか？",
      a: "dアニメストアには初月無料のトライアルがあります。DMM TVも14日間の無料トライアルがあるので、両方試して2.5次元舞台のラインナップを比較するのがおすすめです。",
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
      { "@type": "ListItem", position: 3, name: "dアニメストアとの比較" },
    ],
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="stack-lg">
        {/* --- Breadcrumb --- */}
        <nav className="breadcrumbs" aria-label="パンくずリスト">
          <ol className="breadcrumbs__list">
            <li className="breadcrumbs__item">
              <Link className="breadcrumbs__link" href="/">ホーム</Link>
              <span className="breadcrumbs__divider">/</span>
            </li>
            <li className="breadcrumbs__item">
              <Link className="breadcrumbs__link" href="/watch">配信ガイド</Link>
              <span className="breadcrumbs__divider">/</span>
            </li>
            <li className="breadcrumbs__item">
              <span className="breadcrumbs__current">dアニメストアとの比較</span>
            </li>
          </ol>
        </nav>

        {/* --- HERO --- */}
        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">VOD比較ガイド</span>
            <h1 className="page-title">dアニメストアで2.5次元舞台は見られる？<br />DMM TVとの違いを比較</h1>
            <p className="lead">
              dアニメストアはアニメ特化サービスとして優秀ですが、2.5次元舞台の見放題は限定的です。
              同じ月額550円のDMM TVと比較して、どちらが自分に合うかを判断するためのガイドです。
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

        {/* --- 比較テーブル --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">dアニメストア vs DMM TV — 2.5次元舞台の視点で比較</h2>
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
                <span className="watch-compare-label">2.5次元シリーズ</span>
                <span className="watch-compare-value is-strong">{dmmCount}件確認済み</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">強み</span>
                <span className="watch-compare-value is-strong">2.5次元見放題が充実</span>
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
                <span className="watch-compare-label">2.5次元シリーズ</span>
                <span className="watch-compare-value is-weak">限定的</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">強み</span>
                <span className="watch-compare-value">アニメ特化</span>
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
                <span className="watch-compare-label">2.5次元シリーズ</span>
                <span className="watch-compare-value is-weak">一部のみ</span>
              </div>
              <div className="watch-compare-row">
                <span className="watch-compare-label">強み</span>
                <span className="watch-compare-value">総合VOD</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- dアニメストアの強みと限界 --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">dアニメストアは2.5次元舞台に向いている？</h2>
          <div className="prose-panel">
            dアニメストアは月額550円でアニメ作品を大量に見られるコスパの高いサービスです。
            ただし2.5次元舞台・ミュージカルの見放題ラインナップは限定的で、主要シリーズを網羅しているとは言えません。
            アニメが主目的でたまに2.5次元も見るなら候補になりますが、2.5次元を優先するなら同じ550円のDMM TVを選んだ方が効率的です。
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">dアニメの強み</div>
              <div className="compare-card__title">アニメならコスパ最強</div>
              <div className="compare-card__text">
                月額550円でアニメ作品が大量に見放題。アニメが主目的なら文句なしの選択肢です。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">dアニメの弱み</div>
              <div className="compare-card__title">2.5次元は手薄</div>
              <div className="compare-card__text">
                2.5次元舞台の掲載は限定的。同じ550円ならDMM TVの方が{dmmCount}シリーズ確認済みで圧倒的に充実しています。
              </div>
            </article>
          </div>
        </section>

        {/* --- 同額ならDMM TV --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">同じ月額550円ならDMM TVが有利</h2>
          <div className="prose-panel">
            dアニメストアもDMM TVも月額550円（税込）。同じ価格なら、2.5次元舞台の見放題が圧倒的に充実しているDMM TVを選ぶ方が合理的です。
            DMM TVではStage Connectで確認済みの{dmmCount}シリーズが配信されており、
            14日間の無料トライアルで実際のラインナップを確認してから判断できます。
          </div>
          <div className="catalog-summary">
            <span className="catalog-chip">月額550円 — 同額</span>
            <span className="catalog-chip">DMM TVは{dmmCount}シリーズ</span>
            <span className="catalog-chip">14日間無料トライアル</span>
          </div>
          <div className="action-row">
            <a
              className="action-button action-button-primary"
              href={DMM_PREMIUM_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              14日間無料で始める
            </a>
            <Link className="action-button" href="/watch/dmm">
              DMM TV配信シリーズ一覧
            </Link>
          </div>
        </section>

        {/* --- 他の比較ガイド --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">他のサービスとも比較する</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/u-next">
                U-NEXTとの違いを見る
              </Link>
              <div className="compare-card__text">
                総合VODとしてのU-NEXTと2.5次元舞台の相性を比較しています。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">Overview</div>
              <Link className="compare-card__title" href="/watch/dmm">
                DMM TV配信シリーズ一覧
              </Link>
              <div className="compare-card__text">
                DMM TVで確認済みの{dmmCount}シリーズを一覧で表示しています。
              </div>
            </article>
          </div>
        </section>

        {/* --- FAQ --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">よくある質問（FAQ）</h2>
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
