"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CoStar = {
  slug: string;
  name: string;
  kana: string | null;
  count: number;
};

type Props = {
  coStars: CoStar[];
};

const INITIAL_VISIBLE_COUNT = 5;

export function ActorCoStarsClient({ coStars }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const visible = coStars.slice(0, INITIAL_VISIBLE_COUNT);

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
        <h2 className="section-title">共演ネットワーク</h2>
        <span className="pill">共演数の多い俳優</span>
      </div>

      {isMobile ? (
        <div className="card-carousel">
          {visible.map((coStar, index) => (
            <Link className="cast-card cast-card-link card-carousel-item" href={`/actors/${coStar.slug}`} key={coStar.slug}>
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">共演 {coStar.count} 回</div>
              </div>
              <div className="cast-name">{coStar.name}</div>
              {coStar.kana ? (
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  {coStar.kana}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="cast-grid cast-grid-wide">
          {visible.map((coStar, index) => (
            <Link className="cast-card cast-card-link" href={`/actors/${coStar.slug}`} key={`desktop-${coStar.slug}`}>
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">共演 {coStar.count} 回</div>
              </div>
              <div className="cast-name">{coStar.name}</div>
              {coStar.kana ? (
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  {coStar.kana}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}

      {coStars.length > visible.length ? (
        <>
          <button type="button" className="action-button" onClick={() => setIsOpen(true)}>
            すべて見る ({coStars.length} 人)
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
                  <p className="next-modal-title">共演ネットワーク</p>
                  <p className="catalog-note">共演数の多い俳優を {coStars.length} 人表示しています。</p>
                </div>
                <button type="button" className="next-modal-close" onClick={() => setIsOpen(false)}>
                  閉じる
                </button>
              </div>

              <div className="next-modal-body">
                <div className="cast-grid cast-grid-wide">
                  {coStars.map((coStar, index) => (
                    <Link className="cast-card cast-card-link" href={`/actors/${coStar.slug}`} key={`${coStar.slug}-modal`}>
                      <div className="series-rank-row">
                        <span className="series-rank-badge">{index + 1}</span>
                        <div className="series-rank-count">共演 {coStar.count} 回</div>
                      </div>
                      <div className="cast-name">{coStar.name}</div>
                      {coStar.kana ? (
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                          {coStar.kana}
                        </div>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
