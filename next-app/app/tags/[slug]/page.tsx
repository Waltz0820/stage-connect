import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTagDetailBySlug, toPlainText, truncate } from "../../../lib/stage-connect";

type Params = { slug: string };

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const TYPE_LABELS: Record<string, string> = {
  world: "世界観・ジャンル",
  experience: "観劇体験タグ",
  origin: "原作・出典ジャンル",
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagDetailBySlug(slug);

  if (!tag) {
    return {
      title: "タグが見つかりません | Stage Connect（ステコネ）",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${tag.name}の関連作品 | Stage Connect（ステコネ）`,
    description: truncate(
      toPlainText(tag.description || `${tag.name} に関連する2.5次元舞台・ミュージカル作品を一覧で確認できます。`),
      150
    ),
    robots: { index: false, follow: true },
    alternates: {
      canonical: `${siteUrl}/tags/${tag.slug}`,
    },
  };
}

export default async function TagDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tag = await getTagDetailBySlug(slug);
  if (!tag) notFound();

  const typeLabel = TYPE_LABELS[tag.type] ?? "タグ";

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Tag Detail</span>
            <h1 className="page-title">{tag.name}</h1>
            <p className="lead">
              {tag.description || `${tag.name} に関連する作品をまとめて確認できます。`}
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">{typeLabel}</span>
            <span className="catalog-chip">関連作品 {tag.playsCount}件</span>
            <span className="catalog-chip">タグから作品詳細へ移動</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="section-header-inline">
            <div className="stack-sm">
              <h2 className="section-title">関連作品</h2>
              <p className="catalog-note">{tag.name} に紐づく作品を新しい順に表示しています。</p>
            </div>
            <Link href="/tags" className="action-button">
              タグ一覧へ戻る
            </Link>
          </div>

          <div className="catalog-grid">
            {tag.plays.map((play) => (
              <article key={play.id} className="catalog-card">
                <div className="catalog-card__top">
                  <div className="catalog-card__title">{play.title}</div>
                  <span className="catalog-card__badge">Play</span>
                </div>

                <Link href={`/plays/${play.slug}`} className="catalog-card__body-link">
                  {play.franchiseName ? (
                    <div className="catalog-card__sub">
                      {play.franchiseSlug ? (
                        <Link href={`/series/${play.franchiseSlug}`}>{play.franchiseName}</Link>
                      ) : (
                        play.franchiseName
                      )}
                    </div>
                  ) : null}
                  {play.period ? <div className="catalog-card__sub">{play.period}</div> : null}
                  <div className="catalog-card__text">
                    {truncate(
                      toPlainText(
                        `${play.title} の作品情報ページです。出演キャスト、公演情報、配信情報を確認できます。`
                      ),
                      110
                    )}
                  </div>

                  <div className="catalog-card__footer">
                    <span className="catalog-link">作品詳細を見る</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
