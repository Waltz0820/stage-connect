"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ActorFavorite = {
  slug: string;
  name: string;
  kana: string | null;
};

type PlayFavorite = {
  slug: string;
  title: string;
  franchiseName: string | null;
};

type StoredFavorite =
  | string
  | {
      slug: string;
      name?: string | null;
      kana?: string | null;
      title?: string | null;
      franchiseName?: string | null;
    };

const parseStoredActorFavorites = (value: string | null): ActorFavorite[] => {
  const list = value ? (JSON.parse(value) as StoredFavorite[]) : [];
  return list
    .map((item) =>
      typeof item === "string"
        ? null
        : {
            slug: String(item.slug ?? "").trim(),
            name: String(item.name ?? "").trim(),
            kana: item.kana ?? null,
          }
    )
    .filter((item): item is ActorFavorite => Boolean(item?.slug && item?.name));
};

const parseStoredPlayFavorites = (value: string | null): PlayFavorite[] => {
  const list = value ? (JSON.parse(value) as StoredFavorite[]) : [];
  return list
    .map((item) =>
      typeof item === "string"
        ? null
        : {
            slug: String(item.slug ?? "").trim(),
            title: String(item.title ?? "").trim(),
            franchiseName: item.franchiseName ?? null,
          }
    )
    .filter((item): item is PlayFavorite => Boolean(item?.slug && item?.title));
};

export function FavoritesClient() {
  const [tab, setTab] = useState<"actors" | "plays">("actors");
  const [actors, setActors] = useState<ActorFavorite[]>([]);
  const [plays, setPlays] = useState<PlayFavorite[]>([]);

  useEffect(() => {
    const sync = () => {
      try {
        setActors(parseStoredActorFavorites(window.localStorage.getItem("favorite_actors")));
        setPlays(parseStoredPlayFavorites(window.localStorage.getItem("favorite_plays")));
      } catch {
        setActors([]);
        setPlays([]);
      }
    };

    sync();
    window.addEventListener("favorites-updated", sync);
    return () => window.removeEventListener("favorites-updated", sync);
  }, []);

  const activeCount = useMemo(() => (tab === "actors" ? actors.length : plays.length), [tab, actors.length, plays.length]);

  return (
    <div className="stack-lg">
      <div className="stack-sm">
        <h1 className="page-title">お気に入り</h1>
        <p className="muted">保存したキャストと作品を、あとからまとめて見返せます。</p>
      </div>

      <div className="favorite-tabs">
        <button type="button" className={tab === "actors" ? "is-active" : ""} onClick={() => setTab("actors")}>
          キャスト <span>{actors.length}</span>
        </button>
        <button type="button" className={tab === "plays" ? "is-active" : ""} onClick={() => setTab("plays")}>
          作品 <span>{plays.length}</span>
        </button>
      </div>

      {activeCount === 0 ? (
        <div className="empty-state-card">
          <p className="muted">まだお気に入りがありません。</p>
          <div className="action-row">
            <Link href="/actors" className="action-button">
              キャスト一覧へ
            </Link>
            <Link href="/plays" className="action-button">
              作品一覧へ
            </Link>
          </div>
        </div>
      ) : tab === "actors" ? (
        <div className="results-grid">
          {actors.map((actor) => (
            <article key={actor.slug} className="list-card">
              <Link href={`/actors/${actor.slug}`} className="cast-name">
                {actor.name}
              </Link>
              {actor.kana ? <div className="muted">{actor.kana}</div> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="results-grid">
          {plays.map((play) => (
            <article key={play.slug} className="list-card">
              <Link href={`/plays/${play.slug}`} className="cast-name">
                {play.title}
              </Link>
              {play.franchiseName ? <div className="muted">{play.franchiseName}</div> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
