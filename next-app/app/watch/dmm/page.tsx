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
    title: "DMM TVで観られる2.5次元舞台｜シリーズ一覧・配信ガイド | Stage Connect（ステコネ）",
    description: `2.5次元舞台・ミュージカルをDMM TV（DMMプレミアム）で観るためのガイド。現在${overview.dmmSeriesCount}シリーズが確認済み。刀剣乱舞・ヒプステ・テニミュなど人気作品を網羅。14日間無料トライアルあり。`,
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
      q: `DMM TVで2.5次元舞台は何シリーズ観られますか？`,
      a: `現在、Stage Connectに登録されているDMM TV配信作品は${countLabel}シリーズです。刀剣乱舞、ヒプノシスマイク、テニスの王子様など主要な2.5次元舞台を網羅しています。`,
    },
    {
      q: "DMMプレミアムの料金と無料期間は？",
      a: "DMMプレミアムは月額550円（税込）で、初回登録時は14日間の無料トライアルがあります。期間中は見放題対象の2.5次元舞台を追加料金なしで視聴できます。",
    },
    {
      q: "ここに載っているシリーズは必ず見放題ですか？",
      a: "Stage Connectに登録された配信リンクを元に整理しています。見放題対象か都度課金（レンタル）かは作品によって異なり、配信状況も変動します。最終確認はDMM TVの公式ページで行ってください。",
    },
    {
      q: "シリーズ一覧にない作品を探すには？",
      a: "配信リンクが未登録、または配信が終了している可能性があります。Stage Connectの検索機能から作品名やキャスト名で直接探すか、シリーズ一覧から関連作品を辿ってみてください。",
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
            <span className="eyebrow">DMM Premium × Stage Connect</span>
            <h1 className="page-title">2.5次元舞台をDMM TVで観る</h1>
            <p className="lead">
              DMM TV（DMMプレミアム）で視聴できる2.5次元舞台・ミュージカルを、シリーズ単位で整理しています。
              刀剣乱舞・ヒプステ・テニミュなど、主要シリーズを網羅。
            </p>
          </div>

          <div className="watch-stat-grid">
            <div className="watch-stat-card">
              <div className="watch-stat-label">月額</div>
              <div className="watch-stat-value">550円</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">無料トライアル</div>
              <div className="watch-stat-value">14日間</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">配信シリーズ</div>
              <div className="watch-stat-value">{countLabel}件</div>
            </div>
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
            <Link className="action-button" href="/watch">
              配信ガイドへ戻る
            </Link>
          </div>
        </section>

        {/* --- なぜDMMが強いのか --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">なぜDMM TVが2.5次元に強いのか</h2>
          <div className="prose-panel">
            2.5次元舞台・ミュージカルの配信サービスは複数ありますが、見放題で観られるラインナップの充実度ではDMM TVが圧倒的です。
            刀剣乱舞、ヒプノシスマイク、テニスの王子様、あんさんぶるスターズ、ハイキュー!!、弱虫ペダルなど、
            2.5次元ファンが押さえたい主要シリーズの多くがDMM TVで配信されています。
            他のサービスでは都度課金やレンタルでしか観られない作品も、DMMプレミアムなら見放題対象に含まれていることが多いのが強みです。
          </div>
          <div className="catalog-summary">
            <span className="catalog-chip">2.5次元 見放題が充実</span>
            <span className="catalog-chip">月額550円（税込）</span>
            <span className="catalog-chip">14日間無料トライアル</span>
            <span className="catalog-chip">シリーズ単位で確認しやすい</span>
          </div>
        </section>

        {/* --- 使い方ステップ --- */}
        <section className="section-card stack-md">
          <h2 className="section-title">このページの使い方</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Step 01</div>
              <div className="compare-card__title">シリーズから入る</div>
              <div className="compare-card__text">
                気になるシリーズを選んで、シリーズ詳細ページで年表や作品一覧から履修順を把握します。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">Step 02</div>
              <div className="compare-card__title">作品詳細で深掘る</div>
              <div className="compare-card__text">
                キャスト・公演情報を確認しながら、作品詳細ページの視聴リンクからDMM TVへ遷移できます。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">Step 03</div>
              <div className="compare-card__title">キャストから回遊する</div>
              <div className="compare-card__text">
                気になる俳優の出演作品を芋づる式に辿って、次に観る一本を見つけられます。
              </div>
            </article>
          </div>
        </section>

        {/* --- シリーズ一覧 --- */}
        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">DMM TVで見られるシリーズ</h2>
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

        {/* --- CTA --- */}
        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">まずは無料で確認してみる</h2>
            <a
              className="action-button action-button-primary"
              href={DMM_PREMIUM_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              14日間無料で始める
            </a>
          </div>
          <div className="prose-panel">
            DMMプレミアムは14日間の無料トライアルがあり、期間中は見放題対象の2.5次元舞台を追加料金なしで視聴できます。
            まずは気になるシリーズが見放題に含まれているか、トライアルで確認してみてください。
            合わなければ期間中に解約すれば料金はかかりません。
          </div>
          <div className="action-row">
            <Link className="action-button" href="/series">
              シリーズ一覧を見る
            </Link>
            <Link className="action-button" href="/search">
              作品名・俳優名で検索
            </Link>
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
