"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type RelatedSeries = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  originType: string | null;
};

type Props = {
  items: RelatedSeries[];
};

export function RelatedSeriesClient({ items }: Props) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith("/en");
  const seriesHrefBase = isEnglish ? "/en/series" : "/series";
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 979px), (hover: none) and (pointer: coarse)");
    const update = () => setIsMobile(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  if (isMobile) {
    return (
      <div className="card-carousel">
        {items.map((related) => (
          <Link
            key={related.id}
            className="catalog-card card-carousel-item"
            href={related.slug ? `${seriesHrefBase}/${related.slug}` : seriesHrefBase}
          >
            <div className="catalog-card__top">
              <div className="catalog-card__title">{related.name}</div>
              {related.originType ? <span className="catalog-card__badge">{related.originType}</span> : null}
            </div>
            <div className="catalog-card__text catalog-card__text--clamped">
              {related.description || (isEnglish ? `${related.name} related series archive.` : `${related.name} のシリーズ詳細ページです。`)}
            </div>
            <div className="catalog-card__footer">
              <span className="catalog-link">{isEnglish ? "View series details" : "シリーズ詳細を見る"}</span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="catalog-grid">
      {items.map((related) => (
        <article key={related.id} className="catalog-card">
          <div className="catalog-card__top">
            <div className="catalog-card__title">{related.name}</div>
            {related.originType ? <span className="catalog-card__badge">{related.originType}</span> : null}
          </div>
          <Link className="catalog-card__body-link" href={related.slug ? `${seriesHrefBase}/${related.slug}` : seriesHrefBase}>
            <div className="catalog-card__text catalog-card__text--clamped">
              {related.description || (isEnglish ? `${related.name} related series archive.` : `${related.name} のシリーズ詳細ページです。`)}
            </div>
            <div className="catalog-card__footer">
              <span className="catalog-link">{isEnglish ? "View series details" : "シリーズ詳細を見る"}</span>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
