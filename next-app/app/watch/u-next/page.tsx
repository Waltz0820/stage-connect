import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const metadata: Metadata = {
  title: "U-NEXTと2.5次元舞台｜DMM TVとの比較 | Stage Connect（ステコネ）",
  description:
    "U-NEXTで2.5次元舞台・ミュージカルを見るときの考え方を整理。総合VODとしての強みと、2.5次元を主目的とする場合のDMM TVとの違いを比較ガイドとしてまとめています。",
  alternates: {
    canonical: `${siteUrl}/watch/u-next`,
  },
};

export default function WatchUNextPage() {
  const faqItems = [
    {
      q: "U-NEXTで2.5次元舞台は見られますか？",
      a: "一部の作品は見られますが、2.5次元舞台を主目的にするなら、掲載シリーズ数でDMM TVの方が充実しています。",
    },
    {
      q: "U-NEXTとDMM TVはどう違いますか？",
      a: "U-NEXTは映画・ドラマ・アニメまで広い総合VOD。DMM TVは2.5次元舞台の見放題ラインナップが充実しています。用途で選ぶのがおすすめです。",
    },
    {
      q: "2.5次元舞台を最優先するならどちらがいい？",
      a: "2.5次元舞台を最優先するなら、まずDMM TVを基準に見て、必要に応じてU-NEXTと比較するのがおすすめです。DMMプレミアムは14日間の無料トライアルがあります。",
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
        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">VOD Comparison Guide</span>
            <h1 className="page-title">U-NEXTと2.5次元舞台</h1>
            <p className="lead">
              U-NEXTは総合VODとしては強いサービスですが、2.5次元舞台を主目的にするなら
              DMM TVと比べて考えるのが自然です。ここでは、U-NEXTの強みと、2.5次元舞台を見るうえでの向き不向きを整理します。
            </p>
          </div>

          <div className="action-row">
            <Link className="action-button" href="/watch/dmm">
              DMM TVのガイドを見る
            </Link>
            <Link className="action-button" href="/watch">
              配信ガイドへ戻る
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">U-NEXTの立ち位置</h2>
          <div className="prose-panel">
            U-NEXTは、映画・ドラマ・アニメまで幅広く見たい人には扱いやすい総合VODです。
            ただし、2.5次元舞台・ミュージカルの配信数だけで見ると、主導線にするには少し弱さがあります。
            そのため、2.5次元舞台を軸にするならDMM TVを先に確認し、U-NEXTは「ほかの映像ジャンルも含めて使いたい人向け」として比較するのが自然です。
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">U-NEXT</div>
              <div className="compare-card__title">総合VODとして強い</div>
              <div className="compare-card__text">
                映画・ドラマ・アニメまで広く見る人に向いていて、2.5次元舞台以外も一緒に使いやすいです。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">2.5次元舞台</div>
              <div className="compare-card__title">主軸はDMM TV寄り</div>
              <div className="compare-card__text">
                2.5次元舞台の掲載数を重視するなら、まずはDMM TVを見た方が判断しやすいです。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">U-NEXTとDMM TVの違い</h2>
          <div className="prose-panel">
            U-NEXTの強みは総合力、DMM TVの強みは2.5次元舞台への寄り方です。
            2.5次元舞台を中心に見るなら、掲載数や無料トライアルの分かりやすさも含めてDMM TVの方が入口として扱いやすいです。
            一方で、映画・アニメ・ドラマまで広く使いたいなら、U-NEXTを候補に入れる価値があります。
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">向いている人</div>
              <div className="compare-card__title">総合VODを使いたい</div>
              <div className="compare-card__text">
                2.5次元舞台だけでなく、映画やアニメも同じサービスで見たい人向けです。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">2.5次元重視</div>
              <div className="compare-card__title">最初の比較軸はDMM TV</div>
              <div className="compare-card__text">
                シリーズ配信の把握や無料トライアルの使いやすさでは、DMM TVの方が分かりやすいです。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">判断基準</div>
              <div className="compare-card__title">2.5次元重視か総合重視か</div>
              <div className="compare-card__text">
                2.5次元舞台が最優先ならDMM TV、総合VODとして使うならU-NEXTという見方がしやすいです。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">2.5次元舞台を優先するなら</h2>
            <a
              className="action-button action-button-primary"
              href={DMM_PREMIUM_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              DMM TVを14日間無料で試す
            </a>
          </div>
          <div className="prose-panel">
            2.5次元舞台を主目的にするなら、最初の比較先としてはDMM TVが自然です。
            14日間の無料トライアルで見放題対象を確認し、合わなければ期間中に解約すれば料金はかかりません。
            まずはDMM TVを基準に見てからU-NEXTを比較する流れが分かりやすいです。
          </div>
          <div className="action-row">
            <Link className="action-button" href="/watch/dmm">
              DMM TVのガイドを見る
            </Link>
            <Link className="action-button" href="/series">
              シリーズ一覧を見る
            </Link>
          </div>
        </section>

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
