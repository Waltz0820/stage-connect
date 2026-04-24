"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getEnglishActorName, translateDisplayTextEn } from "../lib/en-copy";

type TopActor = {
  actor: {
    slug: string;
    name: string;
    nameEn?: string | null;
  };
  count: number;
  roles: string[];
  groups: string[];
};

type Props = {
  topActors: TopActor[];
};

const summarizeRoles = (roles: string[], isEnglish: boolean) => {
  if (roles.length === 0) return null;
  const normalized = isEnglish ? roles.map((role) => translateDisplayTextEn(role)) : roles;
  if (normalized.length <= 3) return normalized.join(" / ");
  return isEnglish
    ? `${normalized.slice(0, 3).join(" / ")} / ${normalized.length - 3} more`
    : `${normalized.slice(0, 3).join(" / ")} / ほか${normalized.length - 3}役`;
};

const summarizeGroups = (groups: string[], isEnglish: boolean) => {
  if (groups.length === 0) return null;
  const normalized = isEnglish ? groups.map((group) => translateDisplayTextEn(group)) : groups;
  if (normalized.length <= 2) return normalized.join(" / ");
  return isEnglish
    ? `${normalized.slice(0, 2).join(" / ")} / ${normalized.length - 2} more`
    : `${normalized.slice(0, 2).join(" / ")} / ほか${normalized.length - 2}`;
};

export function SeriesCastOverviewClient({ topActors }: Props) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith("/en");
  const actorHrefBase = isEnglish ? "/en/actors" : "/actors";
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
      <section className="section-card stack-md series-cast-overview-section">
        <h2 className="section-title">{isEnglish ? "Cast and role ranking" : "出演キャスト・役柄一覧"}</h2>
        <p className="muted">{isEnglish ? "Cast data is not available yet." : "出演キャスト情報はまだありません。"}</p>
      </section>
    );
  }

  return (
    <section className="section-card stack-md series-cast-overview-section">
      <h2 className="section-title">{isEnglish ? "Cast and role ranking" : "出演キャスト・役柄一覧"}</h2>

      {isMobile ? (
        <div className="card-carousel">
          {mobileVisible.map((item, index) => (
            <Link
              className="cast-card cast-card-link card-carousel-item"
              href={`${actorHrefBase}/${item.actor.slug}`}
              key={item.actor.slug}
            >
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">{isEnglish ? `${item.count} plays` : `${item.count} 作品`}</div>
              </div>
              <div className="cast-name">{isEnglish ? getEnglishActorName(item.actor) : item.actor.name}</div>
              {summarizeGroups(item.groups, isEnglish) ? (
                <div className="subtle-line" style={{ marginTop: 6 }}>
                  {summarizeGroups(item.groups, isEnglish)}
                </div>
              ) : null}
              {summarizeRoles(item.roles, isEnglish) ? (
                <div className="cast-role">{summarizeRoles(item.roles, isEnglish)}</div>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="cast-grid cast-grid-wide">
          {desktopVisible.map((item, index) => (
            <Link
              className="cast-card cast-card-link"
              href={`${actorHrefBase}/${item.actor.slug}`}
              key={`desktop-${item.actor.slug}`}
            >
              <div className="series-rank-row">
                <span className="series-rank-badge">{index + 1}</span>
                <div className="series-rank-count">{isEnglish ? `${item.count} plays` : `${item.count} 作品`}</div>
              </div>
              <div className="cast-name">{isEnglish ? getEnglishActorName(item.actor) : item.actor.name}</div>
              {summarizeGroups(item.groups, isEnglish) ? (
                <div className="subtle-line" style={{ marginTop: 6 }}>
                  {summarizeGroups(item.groups, isEnglish)}
                </div>
              ) : null}
              {summarizeRoles(item.roles, isEnglish) ? (
                <div className="cast-role">{summarizeRoles(item.roles, isEnglish)}</div>
              ) : null}
            </Link>
          ))}
        </div>
      )}

      {topActors.length > Math.max(mobileVisible.length, desktopVisible.length) ? (
        <>
          <button type="button" className="action-button" onClick={() => setIsOpen(true)}>
            {isEnglish ? `View all cast links (${topActors.length})` : `すべての出演キャストを見る (${topActors.length} 人)`}
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
                <p className="next-modal-title">{isEnglish ? "Cast and role ranking" : "出演キャスト・役柄一覧"}</p>
                <button type="button" className="next-modal-close" onClick={() => setIsOpen(false)}>
                  {isEnglish ? "Close" : "閉じる"}
                </button>
              </div>

              <div className="next-modal-body">
                <div className="cast-grid cast-grid-wide">
                  {topActors.map((item, index) => (
                    <Link
                      className="cast-card cast-card-link"
                      href={`${actorHrefBase}/${item.actor.slug}`}
                      key={`${item.actor.slug}-modal`}
                    >
                      <div className="series-rank-row">
                        <span className="series-rank-badge">{index + 1}</span>
                        <div className="series-rank-count">{isEnglish ? `${item.count} plays` : `${item.count} 作品`}</div>
                      </div>
                      <div className="cast-name">{isEnglish ? getEnglishActorName(item.actor) : item.actor.name}</div>
                      {summarizeGroups(item.groups, isEnglish) ? (
                        <div className="subtle-line" style={{ marginTop: 6 }}>
                          {summarizeGroups(item.groups, isEnglish)}
                        </div>
                      ) : null}
                      {summarizeRoles(item.roles, isEnglish) ? (
                        <div className="cast-role">{summarizeRoles(item.roles, isEnglish)}</div>
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
