"use client";

import { useState } from "react";
import Link from "next/link";

type PlayItem = {
  id: string;
  slug: string;
  title: string;
  period: string | null;
  summary: string | null;
  vod: Record<string, string> | null;
};

type Section = {
  series: {
    id: string;
    slug: string | null;
    name: string;
  };
  plays: PlayItem[];
};

type Props = {
  sections: Section[];
};

const INITIAL_VISIBLE = 6;

const summarizePeriod = (period?: string | null) => {
  if (!period) return "公開時期未定";
  const match = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (!match) return period;
  return `${match[1]}/${match[2].padStart(2, "0")}-`;
};

const truncateText = (value: string, length: number) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) return normalized;
  return `${normalized.slice(0, length)}…`;
};

export function GuidePlaySectionsClient({ sections }: Props) {
  const [openSeriesIds, setOpenSeriesIds] = useState<string[]>([]);

  const toggle = (seriesId: string) => {
    setOpenSeriesIds((current) =>
      current.includes(seriesId) ? current.filter((id) => id !== seriesId) : [...current, seriesId]
    );
  };

  return (
    <div className="stack-lg">
      {sections.map((section) => {
        const isOpen = openSeriesIds.includes(section.series.id);
        const hiddenCount = Math.max(section.plays.length - INITIAL_VISIBLE, 0);

        return (
          <div className="stack-md" key={section.series.id}>
            <div className="section-header">
              <h3 className="section-title" style={{ fontSize: "1.1rem" }}>
                {section.series.name}
              </h3>
              {section.series.slug ? (
                <Link className="inline-link" href={`/series/${section.series.slug}`}>
                  シリーズページへ
                </Link>
              ) : null}
            </div>

            <div className="guide-play-list">
              {section.plays.map((play, index) => {
                const isHidden = !isOpen && index >= INITIAL_VISIBLE;
                return (
                  <article
                    className={`guide-play-row${isHidden ? " guide-play-row--collapsed" : ""}`}
                    key={play.id}
                    aria-hidden={isHidden}
                  >
                    <div className="guide-play-row__main">
                      <div className="guide-play-row__head">
                        <Link className="guide-play-row__title" href={`/plays/${play.slug}`}>
                          {play.title}
                        </Link>
                        {play.vod?.dmm ? <span className="catalog-card__badge">配信あり</span> : null}
                      </div>

                      <div className="guide-play-row__meta">{summarizePeriod(play.period)}</div>

                      <div className="guide-play-row__summary">
                        {truncateText(play.summary || play.title, 80)}
                      </div>
                    </div>

                    <div className="guide-play-row__actions">
                      <Link className="catalog-link" href={`/plays/${play.slug}`}>
                        作品詳細
                      </Link>
                      {play.vod?.dmm ? (
                        <a
                          className="action-button action-button-inline guide-play-row__cta"
                          href={play.vod.dmm}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                        >
                          DMM TV
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            {hiddenCount > 0 ? (
              <button type="button" className="action-button" onClick={() => toggle(section.series.id)}>
                {isOpen ? "折りたたむ" : `すべて見る（残り ${hiddenCount} 件）`}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
