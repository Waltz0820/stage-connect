import type { Metadata } from "next";
import Link from "next/link";
import { getPlayList, toPlainText, truncate } from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "作品一覧 - Stage Connect",
  description:
    "Stage Connect の作品一覧ページです。作品詳細ページへの内部リンクを初期HTMLで出力する Next.js プロトタイプとして構成しています。",
};

export default async function PlaysPage() {
  const plays = await getPlayList();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Plays SSR</span>
            <h1 className="page-title">作品一覧</h1>
            <p className="lead">
              作品一覧から詳細ページへの内部リンクを、初期HTMLに含めて出力する Next.js
              プロトタイプです。現在の掲載作品数は {plays.length} 件です。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="cast-list">
            {plays.map((play) => (
              <article className="cast-card" key={play.slug}>
                <Link className="cast-name" href={`/plays/${play.slug}`}>
                  {play.title}
                </Link>
                {play.franchiseName ? (
                  <div className="muted" style={{ marginTop: 4 }}>
                    {play.franchiseName}
                  </div>
                ) : null}
                {play.period ? (
                  <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                    {play.period}
                  </div>
                ) : null}
                {play.summary ? (
                  <div className="cast-role">{truncate(toPlainText(play.summary), 160)}</div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
