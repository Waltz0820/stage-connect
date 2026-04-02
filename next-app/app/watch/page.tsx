import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "配信で見る | Stage Connect",
  description:
    "2.5次元舞台・ミュージカルをどこで見られるかを整理した配信ガイド。DMM TV を中心に、U-NEXT・dアニメストアとの比較や使い分けもまとめています。",
};

export default async function WatchPage() {
  const overview = await getWatchOverview();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Streaming Guide</span>
            <h1 className="page-title">2.5次元舞台を配信で観る</h1>
            <p className="lead">
              「どこで配信してる？」「見放題で観れる？」という疑問に向けて、
              2.5次元舞台・ミュージカルを配信で観るための導線を整理したガイドです。
            </p>
          </div>

          <div className="watch-stat-grid">
            <div className="watch-stat-card">
              <div className="watch-stat-label">DMM掲載シリーズ</div>
              <div className="watch-stat-value">{overview.dmmSeriesCount.toLocaleString()}件</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">比較ガイド</div>
              <div className="watch-stat-value">3本</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">主軸サービス</div>
              <div className="watch-stat-value">DMM TV</div>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">DMMプレミアムを主軸に考える</h2>
            <a
              className="action-button action-button-primary"
              href="https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text"
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              14日間無料で始める
            </a>
          </div>
          <div className="prose-panel">
            {`2.5次元舞台・ミュージカルの見放題ラインナップがもっとも厚いのは、現状ではDMM TVです。
刀剣乱舞、ヒプステ、テニミュ、あんステなど人気シリーズを追いかけたいなら、まずDMM TVを軸に確認するのが自然です。
Stage Connectでは、シリーズページや作品詳細ページからそのまま配信導線へつながるよう整理しています。`}
          </div>
          <div className="catalog-summary">
            <span className="catalog-chip">月額 550円（税込）</span>
            <span className="catalog-chip">14日間無料トライアル</span>
            <span className="catalog-chip">シリーズ単位で確認可能</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">他のサービスと比較する</h2>
            <p className="catalog-note">まずは DMM TV を基準に、U-NEXT・dアニメストアとの違いを整理しています。</p>
          </div>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Recommended</div>
              <Link className="compare-card__title" href="/watch/dmm">
                DMM TVで配信中のシリーズを見る
              </Link>
              <div className="compare-card__text">
                2.5次元舞台との相性が強い DMM TV を主軸に、シリーズ一覧と導線をまとめています。
              </div>
            </article>

            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/u-next">
                U-NEXT との比較を見る
              </Link>
              <div className="compare-card__text">
                U-NEXT の強みと、2.5次元舞台を探すうえでの違いを整理しています。
              </div>
            </article>

            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/danime">
                dアニメストアとの比較を見る
              </Link>
              <div className="compare-card__text">
                アニメ寄りのサービスとの違いを見ながら、舞台作品の探し方を確認できます。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Stage Connectでの探し方</h2>
          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Step 01</div>
              <div className="compare-card__title">シリーズから探す</div>
              <div className="compare-card__text">同じ作品世界の舞台をまとめてチェック。年表で履修順も把握できます。</div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">Step 02</div>
              <div className="compare-card__title">キャストから探す</div>
              <div className="compare-card__text">推し俳優の出演作一覧や共演ネットワークから、次に観る作品が見つかります。</div>
            </article>
            <article className="compare-card">
              <div className="compare-card__eyebrow">Step 03</div>
              <div className="compare-card__title">キーワードで検索</div>
              <div className="compare-card__text">タイトルが曖昧でも、検索やシリーズ導線から作品詳細にたどれます。</div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">DMM TVで見られる主なシリーズ</h2>
          <div className="catalog-grid">
            {overview.dmmTopFranchises.map((series) => (
              <article className="catalog-card" key={series.id}>
                <div className="catalog-card__top">
                  <Link className="catalog-card__title" href={series.slug ? `/series/${series.slug}` : "/series"}>
                    {series.name}
                  </Link>
                  <span className="catalog-card__badge">{series.playCount}作品</span>
                </div>

                <div className="catalog-card__text">
                  DMM TV から視聴導線をたどれるシリーズです。シリーズページから作品一覧や出演キャストも確認できます。
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

        <section className="section-card stack-md">
          <h2 className="section-title">FAQ</h2>
          <div className="faq-grid">
            <div className="faq-card">
              <p className="faq-question">2.5次元舞台を見放題で観るならどのサービスがおすすめ？</p>
              <p className="faq-answer">見放題ラインナップの充実度で選ぶなら、まずはDMMプレミアムが有力です。</p>
            </div>
            <div className="faq-card">
              <p className="faq-question">Stage Connectで動画は再生できますか？</p>
              <p className="faq-answer">Stage Connectは作品データベースです。作品詳細ページの視聴リンクから各配信サービスへ移動します。</p>
            </div>
            <div className="faq-card">
              <p className="faq-question">配信状況は常に最新ですか？</p>
              <p className="faq-answer">登録された配信リンクを元に整理しています。最終的には遷移先の公式ページでご確認ください。</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
