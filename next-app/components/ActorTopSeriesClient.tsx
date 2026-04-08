"use client";

import Link from "next/link";

type TopSeriesItem = {
  slug: string;
  name: string;
  count: number;
};

type ActorTopSeriesClientProps = {
  items: TopSeriesItem[];
  locale?: "ja" | "en";
};

const INITIAL_VISIBLE = 5;

export function ActorTopSeriesClient({
  items,
  locale = "ja",
}: ActorTopSeriesClientProps) {
  const labels =
    locale === "en"
      ? {
          title: "Major series",
          itemSuffix: "credited works",
          hrefBase: "/en/series",
        }
      : {
          title: "主な出演シリーズ",
          itemSuffix: "作品に出演",
          hrefBase: "/series",
        };

  return (
    <section className="section-card stack-md">
      <h2 className="section-title">{labels.title}</h2>
      <div className="meta-list top-series-list">
        {items.slice(0, INITIAL_VISIBLE).map((series) => (
          <div key={series.slug} className="meta-row top-series-row">
            <div className="meta-value">
              <Link href={`${labels.hrefBase}/${series.slug}`} className="catalog-link">
                {series.name}
              </Link>
              <div className="subtle-line">
                {series.count} {labels.itemSuffix}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
