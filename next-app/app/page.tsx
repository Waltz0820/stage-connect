import type { Metadata } from "next";
import Link from "next/link";
import { getTrendingTags } from "../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const metadata: Metadata = {
  title: "Stage Connect（ステコネ） | 2.5次元舞台・ミュージカルのキャスト・作品アーカイブ",
  description:
    "Stage Connect（ステコネ）は、2.5次元舞台・ミュージカルの作品とキャストをつなぐデジタルアーカイブです。出演者・配信（VOD）・公演情報・シリーズ情報をまとめて確認できます。",
  alternates: {
    canonical: siteUrl,
  },
};

export default async function HomePage() {
  const trendingTags = await getTrendingTags(25);

  const watchLinks = [
    { key: "vod", label: "VOD", to: "/watch" },
    { key: "dmm", label: "DMM", to: "/watch/dmm" },
    { key: "unext", label: "U-NEXT", to: "/watch/u-next" },
  ];

  const getTagStyle = (rank: number) => {
    if (rank <= 3) return "tag-cloud-link is-rank-1";
    if (rank <= 8) return "tag-cloud-link is-rank-2";
    if (rank <= 15) return "tag-cloud-link is-rank-3";
    return "tag-cloud-link is-rank-4";
  };

  const getWatchStyle = (key: string) => {
    if (key === "vod") return "tag-cloud-link is-watch-vod";
    if (key === "dmm") return "tag-cloud-link is-watch-dmm";
    if (key === "unext") return "tag-cloud-link is-watch-unext";
    return "tag-cloud-link";
  };

  return (
    <main className="home-hero">
      <div className="home-hero__spotlight" />
      <div className="home-hero__inner">
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">DIGITAL ARCHIVE</span>

          <h1 className="home-hero__title">
            <span>STAGE</span>
            <span className="is-accent">CONNECT</span>
          </h1>

          <p className="home-hero__lead">
            2.5次元舞台とキャストをつなぐ、デジタル・アーカイブ
          </p>
        </div>

        <div className="home-hero__actions">
          <Link href="/actors" className="home-hero__button is-primary">
            推しを見つける
          </Link>
          <Link href="/plays" className="home-hero__button">
            作品を探す
          </Link>
          <Link href="/series" className="home-hero__button">
            人気シリーズから
          </Link>
        </div>

        <div className="home-tag-cloud">
          <h3 className="home-tag-cloud__title">
            <span />
            TREND WORDS
            <span />
          </h3>

          <div className="home-tag-cloud__items">
            {watchLinks.map((item) => (
              <Link key={item.key} href={item.to} className={getWatchStyle(item.key)}>
                #{item.label}
                <span className="home-tag-cloud__arrow">→</span>
              </Link>
            ))}

            {trendingTags.map((item) => (
              <Link
                key={item.slug}
                href={`/tags/${encodeURIComponent(item.slug)}`}
                className={getTagStyle(item.rank)}
              >
                #{item.tag}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
