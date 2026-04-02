import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTagDetailBySlug, toPlainText, truncate } from "../../../lib/stage-connect";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagDetailBySlug(slug);

  if (!tag) {
    return {
      title: "タグが見つかりません | Stage Connect",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${tag.name}の作品一覧 | Stage Connect`,
    description: truncate(
      toPlainText(tag.description || `${tag.name}に紐づく2.5次元舞台作品一覧です。`),
      150
    ),
    robots: { index: false, follow: true },
    alternates: {
      canonical: `/tags/${tag.slug}`,
    },
  };
}

export default async function TagDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tag = await getTagDetailBySlug(slug);
  if (!tag) notFound();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-sm">
          <span className="eyebrow">TAG</span>
          <h1 className="page-title">{tag.name}</h1>
          <p className="muted">{tag.description || `${tag.name}に紐づく作品をまとめています。`}</p>
          <div className="pill-row">
            <span className="pill accent-pill">作品数: {tag.playsCount}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">関連作品</h2>
          <div className="results-grid">
            {tag.plays.map((play) => (
              <article key={play.id} className="list-card">
                <Link href={`/plays/${play.slug}`} className="cast-name">
                  {play.title}
                </Link>
                {play.franchiseName ? (
                  <div className="muted" style={{ marginTop: 6 }}>
                    {play.franchiseSlug ? (
                      <Link href={`/series/${play.franchiseSlug}`}>{play.franchiseName}</Link>
                    ) : (
                      play.franchiseName
                    )}
                  </div>
                ) : null}
                {play.period ? <div className="subtle-line">{play.period}</div> : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
