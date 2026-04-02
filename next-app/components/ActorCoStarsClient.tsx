"use client";

import Link from "next/link";
import { useState } from "react";

type CoStar = {
  slug: string;
  name: string;
  kana: string | null;
  count: number;
};

type Props = {
  coStars: CoStar[];
};

export function ActorCoStarsClient({ coStars }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const visible = coStars.slice(0, 5);

  return (
    <section className="section-card stack-md">
      <div className="section-header-inline">
        <h2 className="section-title">共演ネットワーク</h2>
        <span className="pill">共演数の多いキャスト</span>
      </div>

      <div className="mobile-only-block">
        <div className="card-carousel">
          {visible.map((coStar, index) => (
            <article className="cast-card card-carousel-item" key={coStar.slug}>
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">共演 {coStar.count}作品</div>
              </div>
              <Link className="cast-name" href={`/actors/${coStar.slug}`}>
                {coStar.name}
              </Link>
              {coStar.kana ? (
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  {coStar.kana}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="desktop-only-grid cast-grid cast-grid-wide">
        {visible.map((coStar, index) => (
          <article className="cast-card" key={`desktop-${coStar.slug}`}>
            <div className="series-rank-row">
              <span className="series-rank-badge">{index + 1}</span>
              <div className="series-rank-count">共演 {coStar.count}作品</div>
            </div>
            <Link className="cast-name" href={`/actors/${coStar.slug}`}>
              {coStar.name}
            </Link>
            {coStar.kana ? (
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                {coStar.kana}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {coStars.length > visible.length ? (
        <>
          <button type="button" className="action-button" onClick={() => setIsOpen(true)}>
            全員を見る（{coStars.length}人）
          </button>

          {isOpen ? (
            <div
              className="next-modal-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setIsOpen(false);
              }}
            >
              <div className="next-modal-panel">
                <div className="next-modal-header">
                  <p className="next-modal-title">共演ネットワーク（{coStars.length}人）</p>
                  <button type="button" className="next-modal-close" onClick={() => setIsOpen(false)}>
                    閉じる
                  </button>
                </div>

                <div className="next-modal-body">
                  <div className="cast-grid cast-grid-wide">
                    {coStars.map((coStar, index) => (
                      <article className="cast-card" key={`${coStar.slug}-modal`}>
                        <div className="series-rank-row">
                          <span className="series-rank-badge">{index + 1}</span>
                          <div className="series-rank-count">共演 {coStar.count}作品</div>
                        </div>
                        <Link className="cast-name" href={`/actors/${coStar.slug}`} onClick={() => setIsOpen(false)}>
                          {coStar.name}
                        </Link>
                        {coStar.kana ? (
                          <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                            {coStar.kana}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
