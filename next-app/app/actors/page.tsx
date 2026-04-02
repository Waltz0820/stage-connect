import type { Metadata } from "next";
import Link from "next/link";
import { formatBirthday, getActorList, getAgeFromBirthday, toPlainText, truncate } from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "俳優一覧 - Stage Connect",
  description:
    "Stage Connect の俳優一覧ページです。俳優詳細ページへの内部リンクを初期HTMLで出力する Next.js プロトタイプとして構成しています。",
};

export default async function ActorsPage() {
  const actors = await getActorList();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Actors SSR</span>
            <h1 className="page-title">俳優一覧</h1>
            <p className="lead">
              俳優一覧から詳細ページへの内部リンクを、初期HTMLに含めて出力する Next.js
              プロトタイプです。現在の掲載俳優数は {actors.length} 人です。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="cast-list">
            {actors.map((actor) => {
              const birthday = formatBirthday(actor.birthday);
              const age = getAgeFromBirthday(actor.birthday);
              return (
                <article className="cast-card" key={actor.slug}>
                  <Link className="cast-name" href={`/actors/${actor.slug}`}>
                    {actor.name}
                  </Link>
                  {actor.kana ? <div className="muted" style={{ marginTop: 4 }}>{actor.kana}</div> : null}
                  {birthday ? (
                    <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                      {birthday}
                      {age !== null ? ` (${age}歳)` : ""}
                    </div>
                  ) : null}
                  {actor.profile ? (
                    <div className="cast-role">{truncate(toPlainText(actor.profile), 160)}</div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
