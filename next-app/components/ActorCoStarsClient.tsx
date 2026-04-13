"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getEnglishActorName } from "../lib/en-copy";

type CoStar = {
  slug: string;
  name: string;
  nameEn?: string | null;
  kana: string | null;
  count: number;
};

type Props = {
  coStars: CoStar[];
};

const INITIAL_VISIBLE_COUNT = 5;
const MAX_VISIBLE_COUNT = 30;

export function ActorCoStarsClient({ coStars }: Props) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith("/en");
  const actorHrefBase = isEnglish ? "/en/actors" : "/actors";
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const visible = coStars.slice(0, INITIAL_VISIBLE_COUNT);
  const modalVisible = coStars.slice(0, MAX_VISIBLE_COUNT);
  const hiddenSeoItems = coStars.slice(MAX_VISIBLE_COUNT);

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

  return (
    <section className="section-card stack-md">
      <div className="section-header-inline">
        <h2 className="section-title">{isEnglish ? "Co-star network" : "共演ネットワーク"}</h2>
        <span className="pill">{isEnglish ? "Frequent co-stars" : "共演数の多い俳優"}</span>
      </div>

      {isMobile ? (
        <div className="card-carousel">
          {visible.map((coStar, index) => (
            (() => {
              const displayName = isEnglish ? getEnglishActorName(coStar) : coStar.name;
              return (
            <Link className="cast-card cast-card-link card-carousel-item" href={`${actorHrefBase}/${coStar.slug}`} key={coStar.slug}>
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">
                  {isEnglish ? `${coStar.count} co-appearances` : `共演 ${coStar.count} 回`}
                </div>
              </div>
              <div className="cast-name">{displayName}</div>
              {coStar.kana ? (
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  {coStar.kana}
                </div>
              ) : null}
            </Link>
              );
            })()
          ))}
        </div>
      ) : (
        <div className="cast-grid cast-grid-wide">
          {visible.map((coStar, index) => (
            (() => {
              const displayName = isEnglish ? getEnglishActorName(coStar) : coStar.name;
              return (
            <Link className="cast-card cast-card-link" href={`${actorHrefBase}/${coStar.slug}`} key={`desktop-${coStar.slug}`}>
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">
                  {isEnglish ? `${coStar.count} co-appearances` : `共演 ${coStar.count} 回`}
                </div>
              </div>
              <div className="cast-name">{displayName}</div>
              {coStar.kana ? (
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  {coStar.kana}
                </div>
              ) : null}
            </Link>
              );
            })()
          ))}
        </div>
      )}

      {coStars.length > visible.length ? (
        <>
          <button type="button" className="action-button" onClick={() => setIsOpen(true)}>
            {isEnglish
              ? `View all (top ${Math.min(coStars.length, MAX_VISIBLE_COUNT)})`
              : `すべて見る（上位 ${Math.min(coStars.length, MAX_VISIBLE_COUNT)} 人）`}
          </button>

          <div
            className={`next-modal-overlay${isOpen ? " is-open" : ""}`}
            aria-hidden={!isOpen}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsOpen(false);
            }}
          >
            <div className="next-modal-panel">
              <div className="next-modal-header">
                <div className="stack-xs">
                  <p className="next-modal-title">{isEnglish ? "Co-star network" : "共演ネットワーク"}</p>
                  <p className="catalog-note">
                    {isEnglish
                      ? `Showing the top ${Math.min(coStars.length, MAX_VISIBLE_COUNT)} co-stars by appearance count.`
                      : `共演数の多い俳優を上位 ${Math.min(coStars.length, MAX_VISIBLE_COUNT)} 人まで表示しています。`}
                  </p>
                </div>
                <button type="button" className="next-modal-close" onClick={() => setIsOpen(false)}>
                  {isEnglish ? "Close" : "閉じる"}
                </button>
              </div>

              <div className="next-modal-body">
                <div className="cast-grid cast-grid-wide">
                  {modalVisible.map((coStar, index) => (
                    (() => {
                      const displayName = isEnglish ? getEnglishActorName(coStar) : coStar.name;
                      return (
                    <Link className="cast-card cast-card-link" href={`${actorHrefBase}/${coStar.slug}`} key={`${coStar.slug}-modal`}>
                      <div className="series-rank-row">
                        <span className="series-rank-badge">{index + 1}</span>
                        <div className="series-rank-count">
                          {isEnglish ? `${coStar.count} co-appearances` : `共演 ${coStar.count} 回`}
                        </div>
                      </div>
                      <div className="cast-name">{displayName}</div>
                      {coStar.kana ? (
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                          {coStar.kana}
                        </div>
                      ) : null}
                    </Link>
                      );
                    })()
                  ))}
                </div>

                {coStars.length > MAX_VISIBLE_COUNT ? (
                  <p className="catalog-note">
                    {isEnglish
                      ? `Only the top ${MAX_VISIBLE_COUNT} co-stars are shown in the visible list.`
                      : `見えるリストでは上位 ${MAX_VISIBLE_COUNT} 人まで表示しています。`}
                  </p>
                ) : null}

                {hiddenSeoItems.length > 0 ? (
                  <div className="seo-link-cluster" aria-hidden="true">
                    {hiddenSeoItems.map((coStar) => (
                      <Link href={`${actorHrefBase}/${coStar.slug}`} key={`${coStar.slug}-seo`}>
                        {isEnglish ? getEnglishActorName(coStar) : coStar.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
