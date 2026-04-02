import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCreditItems,
  getPlayDetailBySlug,
  summarizeCast,
  toPlainText,
  truncate,
} from "../../../lib/stage-connect";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) {
    return {
      title: "作品が見つかりません | Stage Connect",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const castText = summarizeCast(play.cast);
  const description = truncate(
    toPlainText(
      play.summary ||
        `${play.title}の公演データと出演キャスト情報をまとめた作品詳細ページです。主な出演者は ${castText} です。`
    ),
    150
  );

  return {
    title: `${play.title} | 作品詳細 - Stage Connect`,
    description,
    alternates: {
      canonical: `/plays/${play.slug}`,
    },
  };
}

export default async function PlayDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) notFound();

  const creditItems = getCreditItems(play.credits);
  const castSummary = summarizeCast(play.cast);
  const hasVod = Boolean(play.vod && Object.keys(play.vod).length > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: play.title,
    description: toPlainText(
      play.summary || `${play.title}の公演データと出演キャスト情報をまとめた作品詳細ページです。`
    ),
    url: `${siteUrl}/plays/${play.slug}`,
    keywords: play.tags.join(", "),
    about: play.franchiseName || undefined,
    actor: play.cast.slice(0, 20).map((item) => ({
      "@type": "Person",
      name: item.name,
      url: `${siteUrl}/actors/${item.slug}`,
    })),
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Play Detail SSR</span>
            <h1 className="page-title">{play.title}</h1>
            <p className="lead">
              {play.summary ||
                `${play.title}の公演データとキャスト情報をまとめた作品詳細ページです。主な出演者は ${castSummary} です。`}
            </p>
          </div>

          <div className="pill-row">
            {play.franchiseSlug && play.franchiseName ? (
              <Link className="pill" href={`/series/${play.franchiseSlug}`}>
                シリーズ: {play.franchiseName}
              </Link>
            ) : null}
            {play.tags.map((tag) => (
              <span className="pill" key={tag}>
                #{tag}
              </span>
            ))}
            {hasVod ? <span className="pill">配信情報あり</span> : null}
          </div>
        </section>

        <div className="grid grid-2">
          <section className="section-card stack-md">
            <h2 className="section-title">公演情報</h2>
            <div className="meta-list">
              <div className="meta-item">
                <div className="meta-label">主な出演者</div>
                <div className="meta-value">{castSummary}</div>
              </div>
              {play.period ? (
                <div className="meta-item">
                  <div className="meta-label">期間</div>
                  <div className="meta-value">{play.period}</div>
                </div>
              ) : null}
              {play.venue ? (
                <div className="meta-item">
                  <div className="meta-label">劇場</div>
                  <div className="meta-value">{play.venue}</div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="section-card stack-md">
            <h2 className="section-title">視聴と回遊</h2>
            <div className="link-list">
              {play.vod?.dmm ? (
                <a className="inline-link" href={play.vod.dmm} target="_blank" rel="noopener noreferrer">
                  DMM TV で見る
                </a>
              ) : null}
              {play.vod?.unext ? (
                <a className="inline-link" href={play.vod.unext} target="_blank" rel="noopener noreferrer">
                  U-NEXT で見る
                </a>
              ) : null}
              {play.vod?.danime ? (
                <a className="inline-link" href={play.vod.danime} target="_blank" rel="noopener noreferrer">
                  dアニメストアで見る
                </a>
              ) : null}
              <Link className="inline-link" href="/plays">
                作品一覧へ戻る
              </Link>
              <Link className="inline-link" href="/actors">
                俳優一覧を見る
              </Link>
            </div>
          </section>
        </div>

        {creditItems.length > 0 ? (
          <section className="section-card stack-md">
            <h2 className="section-title">クレジット</h2>
            <div className="meta-list">
              {creditItems.map((item) => (
                <div className="meta-item" key={`${item.role}-${item.names.join("-")}`}>
                  <div className="meta-label">{item.role}</div>
                  <div className="meta-value">{item.names.join(" / ")}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section-card stack-md">
          <h2 className="section-title">出演キャスト</h2>
          <div className="cast-list">
            {play.cast.map((item) => (
              <article className="cast-card" key={`${item.slug}-${item.roleName ?? "cast"}-${item.castGroup ?? "group"}`}>
                <Link href={`/actors/${item.slug}`} className="cast-name">
                  {item.name}
                </Link>
                {item.castGroup ? (
                  <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                    {item.castGroup}
                  </div>
                ) : null}
                {item.roleName ? <div className="cast-role">{item.roleName}</div> : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
