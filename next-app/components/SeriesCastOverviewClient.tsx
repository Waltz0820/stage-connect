"use client";

import Link from "next/link";
import { useState } from "react";

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
  const mobileVisible = topActors.slice(0, 12);
  const desktopVisible = topActors.slice(0, 5);

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

      <div className="mobile-only-block">
        <div className="card-carousel">
          {mobileVisible.map((item, index) => (
            <article className="cast-card card-carousel-item" key={item.actor.slug}>
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">{item.count}作品</div>
              </div>
              <Link className="cast-name" href={`/actors/${item.actor.slug}`}>
                {item.actor.name}
              </Link>
              {summarizeGroups(item.groups) ? (
                <div className="subtle-line" style={{ marginTop: 6 }}>
                  {summarizeGroups(item.groups)}
                </div>
              ) : null}
              {summarizeRoles(item.roles) ? <div className="cast-role">{summarizeRoles(item.roles)}</div> : null}
            </article>
          ))}
        </div>
      </div>

      <div className="desktop-only-grid cast-grid cast-grid-wide">
        {desktopVisible.map((item, index) => (
          <article className="cast-card" key={`desktop-${item.actor.slug}`}>
            <div className="series-rank-row">
              <span className="series-rank-badge">{index + 1}</span>
              <div className="series-rank-count">{item.count}作品</div>
            </div>
            <Link className="cast-name" href={`/actors/${item.actor.slug}`}>
              {item.actor.name}
            </Link>
            {summarizeGroups(item.groups) ? (
              <div className="subtle-line" style={{ marginTop: 6 }}>
                {summarizeGroups(item.groups)}
              </div>
            ) : null}
            {summarizeRoles(item.roles) ? <div className="cast-role">{summarizeRoles(item.roles)}</div> : null}
          </article>
        ))}
      </div>

      {topActors.length > Math.max(mobileVisible.length, desktopVisible.length) ? (
        <>
          <button type="button" className="action-button" onClick={() => setIsOpen(true)}>
            すべての出演キャストを見る（{topActors.length}）
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
                      <article className="cast-card" key={`${item.actor.slug}-modal`}>
                        <div className="series-rank-row">
                          <span className="series-rank-badge">{index + 1}</span>
                          <div className="series-rank-count">{item.count}作品</div>
                        </div>
                        <Link
                          className="cast-name"
                          href={`/actors/${item.actor.slug}`}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.actor.name}
                        </Link>
                        {summarizeGroups(item.groups) ? (
                          <div className="subtle-line" style={{ marginTop: 6 }}>
                            {summarizeGroups(item.groups)}
                          </div>
                        ) : null}
                        {summarizeRoles(item.roles) ? (
                          <div className="cast-role">{summarizeRoles(item.roles)}</div>
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
