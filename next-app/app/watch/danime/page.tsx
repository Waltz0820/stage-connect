import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const metadata: Metadata = {
  title: "dアニメストアと2.5次元舞台｜DMM TVとの比較 | Stage Connect（ステコネ）",
  description:
    "dアニメストアで2.5次元舞台・ミュージカルを見るときの考え方を整理。アニメ寄りサービスとしての強みと、2.5次元を主目的とする場合のDMM TVとの違いを比較ガイドとしてまとめています。",
  alternates: {
    canonical: `${siteUrl}/watch/danime`,
  },
};

export default function WatchDanimePage() {
  const faqItems = [
    {
      q: "dアニメストアで2.5次元舞台は見られますか？",
      a: "一部は見られますが、2.5次元舞台の掲載数は限定的です。2.5次元舞台を主目的にするなら、DMM TVの方が比較しやすいです。",
    },
    {
      q: "dアニメストアは2.5次元舞台向きですか？",
      a: "アニメ中心で使う人には良いですが、2.5次元舞台だけを優先するならラインナップ面で物足りなさがあります。",
    },
    {
      q: "2.5次元舞台を一番重視するならどうすればいい？",
      a: "まずはDMM TVを基準に見て、必要に応じてdアニメストアを比較する流れがおすすめです。DMMプレミアムは14日間の無料トライアルがあります。",
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
            <h1 className="page-title">dアニメストアと2.5次元舞台</h1>
            <p className="lead">
              dアニメストアはアニメ寄りのサービスとしては強いですが、2.5次元舞台の配信を見るうえでは
              DMM TVと比較して考えるのが自然です。ここでは、dアニメストアの強みと限界を整理します。
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
          <h2 className="section-title">dアニメストアの立ち位置</h2>
          <div className="prose-panel">
            dアニメストアはアニメに強いサービスで、月額も抑えめです。
            ただし、2.5次元舞台・ミュージカルの掲載は限定的で、主導線にするには弱さがあります。
            2.5次元舞台を中心に見るならDMM TVを先に確認し、dアニメストアはアニメ中心の補助候補として考えるのが自然です。
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">dアニメストア</div>
              <div className="compare-card__title">アニメ中心で強い</div>
              <div className="compare-card__text">
                アニメ視聴を主目的にする人には扱いやすい価格帯と構成です。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">2.5次元舞台</div>
              <div className="compare-card__title">主導線はDMM TV寄り</div>
              <div className="compare-card__text">
                2.5次元舞台だけを優先するなら、掲載数とシリーズ横断の見やすさでDMM TVの方が分かりやすいです。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">dアニメストアとDMM TVの違い</h2>
          <div className="prose-panel">
            dアニメストアはアニメ作品の見やすさが魅力ですが、2.5次元舞台をまとめて追うには不向きです。
            DMM TVは2.5次元舞台・ミュージカルを比較しながら見つけやすく、14日間の無料トライアルもあります。
            2.5次元舞台を主目的にするならDMM TVを先に確認し、dアニメストアは補助的に考えるのが分かりやすいです。
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">価格</div>
              <div className="compare-card__title">月額は軽め</div>
              <div className="compare-card__text">
                コスト面では入りやすいですが、2.5次元舞台を見るためだけだと掲載数で物足りなさがあります。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">掲載数</div>
              <div className="compare-card__title">DMM TVが優位</div>
              <div className="compare-card__text">
                2.5次元舞台・ミュージカルの掲載状況を追うなら、DMM TVの方が比較しやすいです。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">使い分け</div>
              <div className="compare-card__title">アニメ中心なら候補</div>
              <div className="compare-card__text">
                アニメ中心で、2.5次元舞台は補助的に見る人なら検討余地があります。
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
            dアニメストアはアニメ寄りサービスとして魅力がありますが、2.5次元舞台を中心に探すならDMM TVの方が自然です。
            14日間の無料トライアルで見放題対象を確認し、合わなければ期間中に解約すれば料金はかかりません。
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
