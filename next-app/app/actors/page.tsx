import type { Metadata } from "next";
import Link from "next/link";
import {
  formatBirthday,
  getActorList,
  getAgeFromBirthday,
  toPlainText,
  truncate,
} from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "俳優一覧 - Stage Connect",
  description:
    "2.5次元舞台・ミュージカルで活躍する俳優を一覧で整理。プロフィールや出演作品年表へすぐ辿れる、俳優データベースの入口です。",
};

export default async function ActorsPage() {
  const actors = await getActorList();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Actors</span>
            <h1 className="page-title">俳優一覧</h1>
            <p className="lead">
              2.5次元舞台・ミュージカルに出演する俳優を一覧で確認できます。プロフィール、生年月日、
              公式リンク、出演作品年表まで、そのまま各詳細ページから追える構成です。
            </p>
          </div>

          <div className="catalog-summary">
            <span className="catalog-chip">掲載俳優 {actors.length}人</span>
            <span className="catalog-chip">年表ページへ接続</span>
            <span className="catalog-chip">作品ページと相互リンク</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">俳優データベース</h2>
            <p className="catalog-note">
              作品と俳優の行き来がしやすいよう、一覧でも必要なプロフィール情報を拾いやすく整理しています。
            </p>
          </div>

          <div className="catalog-grid">
            {actors.map((actor) => {
              const birthday = formatBirthday(actor.birthday);
              const age = getAgeFromBirthday(actor.birthday);

              return (
                <article className="catalog-card" key={actor.slug}>
                  <div className="catalog-card__top">
                    <Link className="catalog-card__title" href={`/actors/${actor.slug}`}>
                      {actor.name}
                    </Link>
                    {birthday ? <span className="catalog-card__badge">Profile</span> : null}
                  </div>

                  {actor.kana ? <div className="catalog-card__sub">{actor.kana}</div> : null}
                  {birthday ? (
                    <div className="catalog-card__sub">
                      {birthday}
                      {age !== null ? ` (${age}歳)` : ""}
                    </div>
                  ) : null}

                  {actor.profile ? (
                    <div className="catalog-card__text">{truncate(toPlainText(actor.profile), 140)}</div>
                  ) : (
                    <div className="catalog-card__text">プロフィールは順次整備中です。</div>
                  )}

                  <div className="catalog-card__footer">
                    <Link className="catalog-link" href={`/actors/${actor.slug}`}>
                      俳優詳細を見る
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
