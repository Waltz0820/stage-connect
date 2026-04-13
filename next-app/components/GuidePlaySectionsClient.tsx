"use client";

import Link from "next/link";

type PlayItem = {
  id: string;
  slug: string;
  title: string;
  period: string | null;
  vod: Record<string, string> | null;
};

type Props = {
  plays: PlayItem[];
  allSeriesHref?: string | null;
  allSeriesLabel?: string;
  initialVisible?: number;
};

const summarizePeriod = (period?: string | null) => {
  if (!period) return "公開時期未定";
  const match = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (!match) return period;
  return `${match[1]}/${match[2].padStart(2, "0")}-`;
};

export function GuidePlaySectionsClient({
  plays,
  allSeriesHref,
  allSeriesLabel = "全作品を見る",
  initialVisible = 6,
}: Props) {
  const visiblePlays = plays.slice(0, initialVisible);

  return (
    <div className="guide-play-grid">
      {visiblePlays.map((play) => (
        <article className="guide-play-card" key={play.id}>
          <div className="guide-play-card__main">
            <Link className="guide-play-card__title" href={`/plays/${play.slug}`}>
              {play.title}
            </Link>
            <div className="guide-play-card__meta">{summarizePeriod(play.period)}</div>
          </div>

          <div className="guide-play-card__actions">
            <Link className="catalog-link guide-play-card__link" href={`/plays/${play.slug}`}>
              作品詳細
            </Link>
            {play.vod?.dmm ? (
              <a
                className="action-button action-button-inline guide-play-card__cta"
                href={play.vod.dmm}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                DMM TV
              </a>
            ) : (
              <span className="guide-play-card__cta guide-play-card__cta--empty" aria-hidden="true" />
            )}
          </div>
        </article>
      ))}

      {plays.length > initialVisible && allSeriesHref ? (
        <div className="guide-play-grid__more">
          <Link className="action-button" href={allSeriesHref}>
            {allSeriesLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
