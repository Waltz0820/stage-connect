"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ActorItem = {
  slug: string;
  name: string;
  count: number;
};

type SeriesItem = {
  id: string;
  slug: string | null;
  name: string;
  format: string | null;
};

type Props = {
  stageActors: ActorItem[];
  musicalActors: ActorItem[];
  relatedSeries: SeriesItem[];
  hideSeriesLinks?: boolean;
};

export function GuideTopActorsClient({
  stageActors,
  musicalActors,
  relatedSeries,
  hideSeriesLinks = false,
}: Props) {
  const hasStage = stageActors.length > 0;
  const hasMusical = musicalActors.length > 0;
  const hasTabs = hasStage && hasMusical;
  const [activeFormat, setActiveFormat] = useState<"stage" | "musical">(hasStage ? "stage" : "musical");

  const activeActors = activeFormat === "stage" ? stageActors : musicalActors;
  const activeSeries = useMemo(
    () => relatedSeries.filter((series) => series.slug && series.format === activeFormat),
    [activeFormat, relatedSeries]
  );
  const activeSeriesLabel = activeFormat === "stage" ? "刀ステ" : "刀ミュ";
  const primarySeries = activeSeries[0];

  return (
    <div className="stack-md">
      {hasTabs ? (
        <div className="favorite-tabs guide-tabs" role="tablist" aria-label="出演キャストの表示切替">
          <button
            type="button"
            className={activeFormat === "stage" ? "is-active" : ""}
            role="tab"
            aria-selected={activeFormat === "stage"}
            onClick={() => setActiveFormat("stage")}
          >
            刀ステ
          </button>
          <button
            type="button"
            className={activeFormat === "musical" ? "is-active" : ""}
            role="tab"
            aria-selected={activeFormat === "musical"}
            onClick={() => setActiveFormat("musical")}
          >
            刀ミュ
          </button>
        </div>
      ) : null}

      <div className="cast-grid cast-grid-wide">
        {activeActors.map((actor) => (
          <Link className="cast-card cast-card-link" href={`/actors/${actor.slug}`} key={`${activeFormat}-${actor.slug}`}>
            <div className="cast-name">{actor.name}</div>
            <div className="cast-role">{actor.count}作品に出演</div>
          </Link>
        ))}
      </div>

      {!hideSeriesLinks && primarySeries?.slug ? (
        <div className="guide-inline-actions">
          <Link className="action-button" href={`/series/${primarySeries.slug}`}>
            {activeSeriesLabel}の全出演者を確認する
          </Link>
        </div>
      ) : null}
    </div>
  );
}
