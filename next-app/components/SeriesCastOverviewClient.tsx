"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TopActor = {
  actor: {
    slug: string;
    name: string;
  };
  count: number;
  roles: string[];
  groups: string[];
};

type Props = {
  topActors: TopActor[];
};

const summarizeRoles = (roles: string[]) => {
  if (roles.length === 0) return null;
  if (roles.length <= 3) return roles.join(" / ");
  return `${roles.slice(0, 3).join(" / ")} / ほか${roles.length - 3}役`;
};

const summarizeGroups = (groups: string[]) => {
  if (groups.length === 0) return null;
  if (groups.length <= 2) return groups.join(" / ");
  return `${groups.slice(0, 2).join(" / ")} / ほか${groups.length - 2}`;
};

export function SeriesCastOverviewClient({ topActors }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const mobileVisible = topActors.slice(0, 12);
  const desktopVisible = topActors.slice(0, 5);

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

  if (topActors.length === 0) {
    return (
      <section className="section-card stack-md">
        <h2 className="section-title">出演キャスト・役柄一覧</h2>
        <p className="muted">出演キャスト情報はまだありません。</p>
      </section>
    );
  }

  return (
    <section className="section-card stack-md">
      <h2 className="section-title">出演キャスト・役柄一覧</h2>

      {isMobile ? (
        <div className="card-carousel">
          {mobileVisible.map((item, index) => (
            <Link className="cast-card cast-card-link card-carousel-item" href={`/actors/${item.actor.slug}`} key={item.actor.slug}>
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">{item.count}作品</div>
              </div>
              <div className="cast-name">{item.actor.name}</div>
              {summarizeGroups(item.groups) ? (
                <div className="subtle-line" style={{ marginTop: 6 }}>
                  {summarizeGroups(item.groups)}
                </div>
              ) : null}
              {summarizeRoles(item.roles) ? <div className="cast-role">{summarizeRoles(item.roles)}</div> : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="cast-grid cast-grid-wide">
          {desktopVisible.map((item, index) => (
            <Link className="cast-card cast-card-link" href={`/actors/${item.actor.slug}`} key={`desktop-${item.actor.slug}`}>
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">{item.count}作品</div>
              </div>
              <div className="cast-name">{item.actor.name}</div>
              {summarizeGroups(item.groups) ? (
                <div className="subtle-line" style={{ marginTop: 6 }}>
                  {summarizeGroups(item.groups)}
                </div>
              ) : null}
              {summarizeRoles(item.roles) ? <div className="cast-role">{summarizeRoles(item.roles)}</div> : null}
            </Link>
          ))}
        </div>
      )}

      {topActors.length > Math.max(mobileVisible.length, desktopVisible.length) ? (
        <>
          <button type="button" className="action-button" onClick={() => setIsOpen(true)}>
            すべての出演キャストを見る ({topActors.length}人)
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
                  <p className="next-modal-title">出演キャスト・役柄一覧</p>
                  <button type="button" className="next-modal-close" onClick={() => setIsOpen(false)}>
                    閉じる
                  </button>
                </div>

                <div className="next-modal-body">
                  <div className="cast-grid cast-grid-wide">
                    {topActors.map((item, index) => (
                      <Link
                        className="cast-card cast-card-link"
                        href={`/actors/${item.actor.slug}`}
                        key={`${item.actor.slug}-modal`}
                      >
                        <div className="series-rank-row">
                          <span className="series-rank-badge">{index + 1}</span>
                          <div className="series-rank-count">{item.count}作品</div>
                        </div>
                        <div className="cast-name">{item.actor.name}</div>
                        {summarizeGroups(item.groups) ? (
                          <div className="subtle-line" style={{ marginTop: 6 }}>
                            {summarizeGroups(item.groups)}
                          </div>
                        ) : null}
                        {summarizeRoles(item.roles) ? (
                          <div className="cast-role">{summarizeRoles(item.roles)}</div>
                        ) : null}
                      </Link>
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
