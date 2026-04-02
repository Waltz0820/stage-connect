import type { Metadata } from "next";
import Link from "next/link";
import { getPlayList, toPlainText, truncate } from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "作品一覧 - Stage Connect",
  description:
    "2.5次元舞台・ミュージカル作品を一覧で整理。シリーズ、あらすじ、公演期間を横断しながら、気になる作品詳細へスムーズに辿れます。",
};

export default async function PlaysPage() {
  const plays = await getPlayList();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Plays</span>
            <h1 className="page-title">作品一覧</h1>
            <p className="lead">
              2.5次元舞台・ミュージカル作品を、シリーズや公演時期の流れとあわせて一覧で確認できます。
              データベースの起点として、気になる作品詳細へそのまま辿れる構成です。
            </p>
          </div>

          <div className="catalog-summary">
            <span className="catalog-chip">掲載作品 {plays.length}件</span>
            <span className="catalog-chip">新しい公演から確認</span>
            <span className="catalog-chip">シリーズページとも連動</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">作品データベース</h2>
            <p className="catalog-note">
              各作品ページでは、あらすじ、公演情報、クレジット、配信導線、出演キャストまでまとめて確認できます。
            </p>
          </div>

          <div className="catalog-grid">
            {plays.map((play) => (
              <article className="catalog-card" key={play.slug}>
                <div className="catalog-card__top">
                  <Link className="catalog-card__title" href={`/plays/${play.slug}`}>
                    {play.title}
                  </Link>
                  {play.franchiseName ? <span className="catalog-card__badge">シリーズ</span> : null}
                </div>

                {play.franchiseName ? <div className="catalog-card__sub">{play.franchiseName}</div> : null}
                {play.period ? <div className="catalog-card__sub mono">{play.period}</div> : null}

                {play.summary ? (
                  <div className="catalog-card__text">{truncate(toPlainText(play.summary), 140)}</div>
                ) : (
                  <div className="catalog-card__text">作品概要は順次整備中です。</div>
                )}

                <div className="catalog-card__footer">
                  <Link className="catalog-link" href={`/plays/${play.slug}`}>
                    作品詳細を見る
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
