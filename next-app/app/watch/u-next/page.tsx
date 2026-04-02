import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const metadata: Metadata = {
  title: "U-NEXTと2.5次元舞台 | Stage Connect（ステコネ）",
  description:
    "Stage Connect（ステコネ）で、U-NEXTで2.5次元舞台・ミュージカルを見るときの考え方を整理。DMM TVとの違いや、どんな人に向いているかを比較できます。",
};

metadata.alternates = {
  canonical: `${siteUrl}/watch/u-next`,
};

export default function WatchUNextPage() {
  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card hero-card--center stack-md">
          <div className="stack-sm">
            <span className="eyebrow">VOD Comparison Guide</span>
            <h1 className="page-title">U-NEXTと2.5次元舞台</h1>
            <p className="lead">
              U-NEXT は総合VODとしては強いサービスですが、2.5次元舞台を主目的にするなら DMM TV
              と比べて考えるのが自然です。ここでは、U-NEXT
              の強みと、2.5次元舞台を見るうえでの向き不向きを整理します。
            </p>
          </div>

          <div className="action-row">
            <Link className="action-button" href="/watch/dmm">
              DMM TVとの違いを見る
            </Link>
            <Link className="action-button" href="/watch">
              配信ガイドへ戻る
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">U-NEXTの立ち位置</h2>
          <div className="prose-panel">
            U-NEXT は、映画・ドラマ・アニメまで幅広く見たい人には扱いやすい総合VODです。
            ただし、2.5次元舞台・ミュージカルの配信数だけで見ると、主導線にするには少し弱さがあります。
            そのため、2.5次元舞台を軸にするなら DMM TV を先に確認し、U-NEXT
            は「ほかの映像ジャンルも含めて使いたい人向け」として考えるのが自然です。
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
              <div className="compare-card__eyebrow">2.5D</div>
              <div className="compare-card__title">主軸はDMM TV寄り</div>
              <div className="compare-card__text">
                2.5次元舞台の掲載数を重視するなら、まずは DMM TV を見た方が判断しやすいです。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">U-NEXTとDMM TVの違い</h2>
          <div className="prose-panel">
            U-NEXT の強みは総合力、DMM TV
            の強みは2.5次元舞台への寄り方です。2.5次元舞台を中心に見るなら、掲載数や無料トライアルの分かりやすさも含めて
            DMM TV の方が入口として扱いやすいです。一方で、映画・アニメ・ドラマまで広く使いたいなら、U-NEXT
            を候補に入れる価値があります。
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
              <div className="compare-card__eyebrow">2.5次元舞台</div>
              <div className="compare-card__title">最初の比較軸はDMM TV</div>
              <div className="compare-card__text">
                シリーズ配信の把握や無料トライアルの使いやすさでは、DMM TV の方が分かりやすいです。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">判断基準</div>
              <div className="compare-card__title">2.5次元重視か総合重視か</div>
              <div className="compare-card__text">
                2.5次元舞台が最優先なら DMM TV、総合VODとして使うなら U-NEXT という見方がしやすいです。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">こんな人に向いています</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">向いている</div>
              <div className="compare-card__title">映画やドラマもよく見る</div>
              <div className="compare-card__text">
                2.5次元舞台に加えて、総合VODとして広く使いたい人には相性が良いです。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">向いていない</div>
              <div className="compare-card__title">2.5次元舞台だけを優先したい</div>
              <div className="compare-card__text">
                2.5次元舞台の掲載数だけで選びたいなら、先に DMM TV を確認した方が迷いにくいです。
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
              DMM TVを無料で試す
            </a>
          </div>
          <div className="prose-panel">
            2.5次元舞台を主目的にするなら、最初の比較先としては DMM TV
            が自然です。無料トライアルがあり、シリーズごとの掲載状況も追いやすいため、まずは
            DMM TV を基準に見てから U-NEXT を比較する流れが分かりやすいです。
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
          <h2 className="section-title">FAQ</h2>
          <div className="faq-grid">
            <div className="faq-card">
              <p className="faq-question">U-NEXTで2.5次元舞台は見られますか？</p>
              <p className="faq-answer">
                一部は見られますが、2.5次元舞台の掲載数を最優先するなら DMM TV の方が比較しやすいです。
              </p>
            </div>
            <div className="faq-card">
              <p className="faq-question">U-NEXTとDMM TVはどう違いますか？</p>
              <p className="faq-answer">
                U-NEXT は総合VODとしての強みがあり、DMM TV は2.5次元舞台に寄った使い方がしやすいのが違いです。
              </p>
            </div>
            <div className="faq-card">
              <p className="faq-question">2.5次元舞台を一番重視するなら？</p>
              <p className="faq-answer">
                まずは DMM TV を基準に見て、必要に応じて U-NEXT を比較する流れがおすすめです。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
