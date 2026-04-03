import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "配信で観る｜2.5次元舞台の視聴ガイド | Stage Connect（ステコネ）",
  description:
    "2.5次元舞台・ミュージカルをどこで配信で観られるかを整理。DMM TVを中心に、U-NEXT・dアニメストアとの違いも比較。掲載シリーズ数と無料トライアルで選ぶための配信ガイドです。",
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
      a: "掲載シリーズ数と無料トライアルの両面から、まずはDMM TV（DMMプレミアム）を基準に考えるのがおすすめです。月額550円・14日間無料で始められます。",
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

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="stack-lg">
        {/* --- HERO --- */}
        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Streaming Guide</span>
            <h1 className="page-title">2.5次元舞台を配信で観る</h1>
            <p className="lead">
              「どこで配信しているか」「何を基準に選べばいいか」を
              Stage Connect の視点で整理したガイドです。
              DMM TVを主軸に、U-NEXT・dアニメストアとの違いも比較できます。
            </p>
          </div>

          <div className="watch-stat-grid">
            <div className="watch-stat-card">
              <div className="watch-stat-label">DMM掲載シリーズ</div>
              <div className="watch-stat-value">{countLabel}件</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">無料トライアル</div>
              <div className="watch-stat-value">14日間</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">月額</div>
              <div className="watch-stat-value">550円</div>
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
            2.5次元舞台・ミュージカルの配信をできるだけ広く見たいなら、まずはDMM TVを起点に考えるのが自然です。
            Stage Connectでも掲載シリーズ数と使いやすさの両面から、最初に確認するサービスとしてDMM TVを主導線に置いています。
            14日間の無料トライアルがあり、シリーズ単位でどの作品が配信されているかも追いやすいため、2.5次元の入口として最も扱いやすいサービスです。
          </div>
          <div className="catalog-summary">
            <span className="catalog-chip">月額550円（税込）</span>
            <span className="catalog-chip">14日間無料トライアル</span>
            <span className="catalog-chip">2.5次元 見放題が充実</span>
          </div>
        </section>

        {/* --- 3サービス比較 --- */}
        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">3サービスの違い</h2>
            <p className="catalog-note">
              DMM TVを主軸に、U-NEXT・dアニメストアそれぞれの強みと向き不向きを整理しています。
            </p>
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Recommended</div>
              <Link className="compare-card__title" href="/watch/dmm">
                DMM TVで配信中のシリーズを見る
              </Link>
              <div className="compare-card__text">
                2.5次元舞台を優先して探すならまずここ。{countLabel}シリーズのラインナップと14日間の無料トライアルで判断できます。
              </div>
            </article>

            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/u-next">
                U-NEXTとの違いを見る
              </Link>
              <div className="compare-card__text">
                総合VODとしての強みと、2.5次元舞台を見るうえでの向き不向きを整理しています。
              </div>
            </article>

            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/danime">
                dアニメストアとの違いを見る
              </Link>
              <div className="compare-card__text">
                アニメ寄りサービスとしての相性と、2.5次元舞台を見る際の注意点をまとめています。
              </div>
            </article>
          </div>
        </section>

        {/* --- 使い方 --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">Stage Connectでの使い方</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Step 01</div>
              <div className="compare-card__title">シリーズから探す</div>
              <div className="compare-card__text">
                気になるシリーズのページを開くと、配信のある作品をまとめて確認できます。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">Step 02</div>
              <div className="compare-card__title">作品詳細で確認する</div>
              <div className="compare-card__text">
                作品詳細では、キャストやあらすじと一緒に配信状況も確認できます。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">Step 03</div>
              <div className="compare-card__title">ガイドで比較する</div>
              <div className="compare-card__text">
                迷ったらこの配信ガイドで比較し、無料トライアルや掲載数を基準に選ぶのがおすすめです。
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
