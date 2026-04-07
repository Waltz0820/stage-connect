import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "U-NEXTで2.5次元舞台は見られる？DMM TVとの比較ガイド | Stage Connect（ステコネ）",
    description:
      "U-NEXTで2.5次元舞台・ミュージカルを見たい人向けの比較ガイド。料金・無料トライアル・見放題シリーズ数をDMM TVと比較。2.5次元を優先するならどちらが最適かを整理しています。",
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
      a: "一部の作品は見放題またはレンタルで視聴可能ですが、2.5次元舞台の見放題ラインナップに限ると、DMM TVの方が充実しています。",
    },
    {
      q: "U-NEXTとDMM TVはどう使い分ければいい？",
      a: `2.5次元舞台を最優先するならDMM TV（${dmmCount}シリーズ確認済み、月額550円）。映画・ドラマ・アニメも含めて1つのサービスで済ませたいならU-NEXT（月額2,189円）。目的で選ぶのが自然です。`,
    },
    {
      q: "U-NEXTの2.5次元舞台は見放題ですか？",
      a: "作品によって見放題とレンタル（都度課金）に分かれます。見放題対象かどうかは公式サイトで確認してください。DMM TVでは2.5次元舞台の見放題がより広くカバーされています。",
    },
    {
      q: "2.5次元舞台を見るのに一番安いサービスは？",
      a: "月額だけで見るとDMM TVが550円で最安です。U-NEXTは月額2,189円ですが、毎月1,200ポイントが付与されるため映画レンタル等も含めた総合利用なら価値があります。",
    },
    {
      q: "U-NEXTの無料トライアルで2.5次元舞台を見られますか？",
      a: "U-NEXTには31日間の無料トライアルがあり、見放題対象の2.5次元舞台は期間中に視聴できます。DMM TVも14日間の無料トライアルがあるので、両方試して比較するのもおすすめです。",
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
      { "@type": "ListItem", position: 3, name: "U-NEXTとの比較" },
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
              <span className="breadcrumbs__current">U-NEXTとの比較</span>
            </li>
          </ol>
        </nav>

        {/* --- HERO --- */}
        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">VOD比較ガイド</span>
            <h1 className="page-title">U-NEXTで2.5次元舞台は見られる？<br />DMM TVとの違いを比較</h1>
            <p className="lead">
              U-NEXTは総合VODとしては強いサービスですが、2.5次元舞台の見放題ラインナップに限ると
              DMM TVが優位です。料金・無料トライアル・シリーズ数で比較し、どちらが自分に合うかを判断するためのガイドです。
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
          <h2 className="section-title">U-NEXT vs DMM TV — 2.5次元舞台の視点で比較</h2>
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
                <span className="watch-compare-value">総合VOD（映画・ドラマ・アニメ）</span>
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
          </div>
        </section>

        {/* --- U-NEXTの強みと限界 --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">U-NEXTは2.5次元舞台に向いている？</h2>
          <div className="prose-panel">
            U-NEXTは映画・ドラマ・アニメを含む30万本以上の動画を配信する国内最大級の総合VODです。
            2.5次元舞台も一部は見放題に含まれていますが、「2.5次元舞台だけを目的に加入する」には月額2,189円はやや割高感があります。
            一方で、毎月1,200ポイントが付与されるため、映画のレンタルや漫画購入など幅広く使う人にはトータルで見合う可能性があります。
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">U-NEXTの強み</div>
              <div className="compare-card__title">総合力で選ぶなら</div>
              <div className="compare-card__text">
                映画・ドラマ・アニメ・漫画まで一つのサービスで完結。2.5次元以外も広く見たい人向けです。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">U-NEXTの弱み</div>
              <div className="compare-card__title">2.5次元は手薄</div>
              <div className="compare-card__text">
                2.5次元舞台の見放題シリーズ数ではDMM TVに及ばず、月額も約4倍。2.5次元特化なら割高です。
              </div>
            </article>
          </div>
        </section>

        {/* --- DMM TVを選ぶ理由 --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">2.5次元舞台を優先するならDMM TV</h2>
          <div className="prose-panel">
            2.5次元舞台・ミュージカルの見放題ラインナップが最も充実しているのがDMM TVです。
            月額550円と手頃で、刀剣乱舞・ヒプノシスマイク・テニスの王子様・あんさんぶるスターズなど
            主要シリーズの多くがカバーされています。
            Stage Connectで確認済みのDMM TV配信シリーズは現在{dmmCount}件。
            14日間の無料トライアルがあるので、まず試して判断するのが最も効率的です。
          </div>
          <div className="catalog-summary">
            <span className="catalog-chip">月額550円（税込）</span>
            <span className="catalog-chip">14日間無料トライアル</span>
            <span className="catalog-chip">{dmmCount}シリーズ確認済み</span>
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

        {/* --- 使い分けの結論 --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">U-NEXTとDMM TVの使い分け方</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">2.5次元が最優先</div>
              <div className="compare-card__title">→ DMM TV</div>
              <div className="compare-card__text">
                2.5次元舞台をできるだけ多く見放題で観たい人。月額550円で{dmmCount}シリーズ。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">総合的に使いたい</div>
              <div className="compare-card__title">→ U-NEXT</div>
              <div className="compare-card__text">
                2.5次元舞台に加えて映画・ドラマ・アニメも1サービスで済ませたい人向け。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">迷ったら</div>
              <div className="compare-card__title">→ 両方トライアル</div>
              <div className="compare-card__text">
                DMM TVは14日間、U-NEXTは31日間の無料期間あり。両方試して比較するのが確実です。
              </div>
            </article>
          </div>
        </section>

        {/* --- 他の比較ガイド --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">他のサービスとも比較する</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/danime">
                dアニメストアとの違いを見る
              </Link>
              <div className="compare-card__text">
                アニメ特化サービスとの比較。2.5次元舞台を見るうえでの強みと限界をまとめています。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">Overview</div>
              <Link className="compare-card__title" href="/watch/dmm">
                DMM TV配信シリーズ一覧
              </Link>
              <div className="compare-card__text">
                DMM TVで確認済みの{dmmCount}シリーズを一覧で表示。シリーズ詳細への導線もあります。
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
