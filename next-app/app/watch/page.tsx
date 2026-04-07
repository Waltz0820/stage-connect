import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "2.5次元舞台の配信サービス比較ガイド｜DMM TV・U-NEXT・dアニメストア | Stage Connect（ステコネ）",
  description:
    "2.5次元舞台・ミュージカルをどの配信サービスで見るべきかを比較。DMM TV・U-NEXT・dアニメストアの料金・無料トライアル・2.5次元の充実度を一覧比較。DMM TVを主軸にした配信ガイドです。",
  alternates: {
    canonical: `${siteUrl}/watch`,
  },
};

export default async function WatchPage() {
  const overview = await getWatchOverview();
  const countLabel = overview.dmmSeriesCount.toLocaleString();

  const faqItems = [
    {
      q: "2.5次元舞台を見るならどのサービスがおすすめですか？",
      a: `掲載シリーズ数と月額のバランスから、まずはDMM TV（DMMプレミアム）を基準に考えるのがおすすめです。${countLabel}シリーズ確認済み、月額550円・14日間無料で始められます。`,
    },
    {
      q: "DMM TV・U-NEXT・dアニメストアの違いは？",
      a: "DMM TVは2.5次元舞台の見放題が最も充実（月額550円）。U-NEXTは総合VODとして強い（月額2,189円）。dアニメストアはアニメ特化（月額550円）。2.5次元が主目的ならDMM TVが最適です。",
    },
    {
      q: "Stage Connectでは何が分かりますか？",
      a: "作品詳細・シリーズ年表・キャスト情報・配信状況を横断して確認できます。「次に観る一本」を効率的に見つけるための2.5次元舞台データベースです。",
    },
    {
      q: "配信情報は最新ですか？",
      a: "掲載時点の情報をもとに整理しています。配信状況は変動するため、最終確認は各配信サービスの公式ページで行ってください。",
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
      { "@type": "ListItem", position: 2, name: "配信ガイド" },
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
              <span className="breadcrumbs__current">配信ガイド</span>
            </li>
          </ol>
        </nav>

        {/* --- HERO --- */}
        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Streaming Guide</span>
            <h1 className="page-title">2.5次元舞台の配信サービス比較</h1>
            <p className="lead">
              DMM TV・U-NEXT・dアニメストアの3サービスを、2.5次元舞台の視点で比較。
              料金・無料トライアル・見放題シリーズ数から、自分に合うサービスを見つけるためのガイドです。
            </p>
          </div>

          <div className="watch-stat-grid">
            <div className="watch-stat-card">
              <div className="watch-stat-label">DMM掲載シリーズ</div>
              <div className="watch-stat-value">国内最多級</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">最安月額</div>
              <div className="watch-stat-value">550円</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">無料トライアル</div>
              <div className="watch-stat-value">14日間〜</div>
            </div>
          </div>
        </section>

        {/* --- 3サービス比較テーブル --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">3サービス一覧比較</h2>
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
                <span className="watch-compare-value is-strong">国内最多級</span>
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

        {/* --- DMM TV 主軸 --- */}
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
            2.5次元舞台・ミュージカルの見放題をできるだけ広く見たいなら、まずはDMM TVを起点に考えるのが自然です。
            DMM TVは2.5次元舞台の見放題シリーズ数が国内最多級。
            月額550円・14日間の無料トライアルがあり、シリーズ単位で配信状況も追いやすいため、2.5次元の入口として最も扱いやすいサービスです。
          </div>
        </section>

        {/* --- 各サービス詳細ガイド --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">サービス別の詳細ガイド</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Recommended</div>
              <Link className="compare-card__title" href="/watch/dmm">
                DMM TVの配信シリーズを見る
              </Link>
              <div className="compare-card__text">
                {countLabel}シリーズのラインナップと14日間の無料トライアルで判断できます。
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
                アニメ特化サービスとの比較。同じ月額550円でも2.5次元の充実度はDMM TVが優位です。
              </div>
            </article>
          </div>
        </section>

        {/* --- 主なシリーズ --- */}
        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">DMM TVで見られる主なシリーズ</h2>
            <Link className="action-button" href="/watch/dmm">一覧を見る</Link>
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
