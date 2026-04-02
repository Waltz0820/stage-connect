import type { Metadata } from "next";
import Link from "next/link";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const metadata: Metadata = {
  title: "dアニメストアと2.5次元舞台 - Stage Connect",
  description:
    "dアニメストアで2.5次元舞台・ミュージカルを見るときの考え方を整理しています。アニメ寄りサービスとしての強みと、DMM TVとの違いを比較できます。",
};

export default function WatchDanimePage() {
  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">VOD Comparison Guide</span>
            <h1 className="page-title">dアニメストアと2.5次元舞台</h1>
            <p className="lead">
              dアニメストアはアニメ寄りのサービスとしては強いですが、2.5次元舞台の配信を見るうえでは
              DMM TV と比較して考えるのが自然です。ここでは、dアニメストアの強みと限界を整理します。
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
          <h2 className="section-title">dアニメストアの立ち位置</h2>
          <div className="prose-panel">
            dアニメストアはアニメに強いサービスで、月額も抑えめです。ただし、2.5次元舞台・ミュージカルの掲載は限定的で、
            主導線にするには少し弱さがあります。2.5次元舞台を中心に見るなら DMM TV
            を先に確認し、dアニメストアはアニメ寄りの補助候補として考えるのが自然です。
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">dアニメ</div>
              <div className="compare-card__title">アニメ中心で強い</div>
              <div className="compare-card__text">
                アニメ視聴を主目的にする人には扱いやすい価格帯と構成です。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">2.5D</div>
              <div className="compare-card__title">主導線はDMM TV寄り</div>
              <div className="compare-card__text">
                2.5次元舞台だけを優先するなら、掲載数の見え方も含めて DMM TV の方が分かりやすいです。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">dアニメストアとDMM TVの違い</h2>
          <div className="prose-panel">
            dアニメストアはアニメ作品の見やすさが魅力ですが、2.5次元舞台をまとめて追うには不向きです。
            一方で DMM TV は、2.5次元舞台・ミュージカルを比較しながら見つけやすく、無料トライアルもあります。
            そのため、2.5次元舞台を主目的にするなら DMM TV
            を先に確認し、dアニメストアは補助的に考えるのが分かりやすいです。
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
                2.5次元舞台・ミュージカルの掲載状況を追うなら、DMM TV の方が比較しやすいです。
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
          <h2 className="section-title">こんな人に向いています</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">向いている</div>
              <div className="compare-card__title">アニメを主に観る</div>
              <div className="compare-card__text">
                アニメ中心で、その延長で2.5次元舞台も少し見る人には相性があります。
              </div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">向いていない</div>
              <div className="compare-card__title">2.5次元舞台を最優先したい</div>
              <div className="compare-card__text">
                その場合は最初から DMM TV を基準に見た方が、比較も判断もしやすいです。
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
            dアニメストアはアニメ寄りサービスとして魅力がありますが、2.5次元舞台を中心に探すなら DMM TV
            の方が自然です。無料トライアルと掲載数を基準に、まずは DMM TV
            を見てから比較するのがおすすめです。
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
              <p className="faq-question">dアニメストアで2.5次元舞台は見られますか？</p>
              <p className="faq-answer">
                一部は見られますが、2.5次元舞台の掲載数は限定的なので、主導線としては DMM TV の方が見やすいです。
              </p>
            </div>
            <div className="faq-card">
              <p className="faq-question">dアニメストアは2.5次元舞台向きですか？</p>
              <p className="faq-answer">
                アニメ中心で使う人には良いですが、2.5次元舞台だけを優先するなら少し物足りなさがあります。
              </p>
            </div>
            <div className="faq-card">
              <p className="faq-question">2.5次元舞台を一番重視するなら？</p>
              <p className="faq-answer">
                まずは DMM TV を基準に見て、必要に応じて dアニメストアを比較する流れがおすすめです。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
