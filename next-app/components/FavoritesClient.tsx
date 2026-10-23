"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

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

const removeStoredFavorite = (storageKey: "favorite_actors" | "favorite_plays", slug: string) => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const current = raw ? (JSON.parse(raw) as StoredFavorite[]) : [];
    const next = current.filter((item) => (typeof item === "string" ? item : item?.slug) !== slug);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("favorites-updated"));
    return true;
  } catch {
    return false;
  }
};

export function FavoritesClient() {
  const [tab, setTab] = useState<"actors" | "plays">("actors");
  const [actors, setActors] = useState<ActorFavorite[]>([]);
  const [plays, setPlays] = useState<PlayFavorite[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => {
      try {
        setActors(parseStoredActorFavorites(window.localStorage.getItem("favorite_actors")));
        setPlays(parseStoredPlayFavorites(window.localStorage.getItem("favorite_plays")));
        setStorageError(false);
      } catch {
        setActors([]);
        setPlays([]);
        setStorageError(true);
      }
      setReady(true);
    };

    sync();
    window.addEventListener("favorites-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("favorites-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const activeCount = tab === "actors" ? actors.length : plays.length;

  const removeActor = (slug: string) => {
    if (removeStoredFavorite("favorite_actors", slug)) {
      setActors((current) => current.filter((actor) => actor.slug !== slug));
      setNotice("お気に入りから外しました。");
    } else setNotice("保存内容を変更できませんでした。ブラウザの保存設定をご確認ください。");
  };

  const removePlay = (slug: string) => {
    if (removeStoredFavorite("favorite_plays", slug)) {
      setPlays((current) => current.filter((play) => play.slug !== slug));
      setNotice("お気に入りから外しました。");
    } else setNotice("保存内容を変更できませんでした。ブラウザの保存設定をご確認ください。");
  };

  return (
    <div className="stack-lg">
      <Breadcrumbs items={[{ label: "お気に入り" }]} />
      <div className="hero-card stack-sm">
        <span className="eyebrow">MY COLLECTION</span>
        <h1 className="page-title">お気に入り</h1>
        <p className="muted">保存した俳優と作品をまとめて見返せます。</p>
      </div>

      <div className="favorite-tabs" aria-label="お気に入りの表示切替">
        <button type="button" aria-pressed={tab === "actors"} className={tab === "actors" ? "is-active" : ""} onClick={() => setTab("actors")}>
          俳優 <span>{ready ? actors.length : "—"}</span>
        </button>
        <button type="button" aria-pressed={tab === "plays"} className={tab === "plays" ? "is-active" : ""} onClick={() => setTab("plays")}>
          作品 <span>{ready ? plays.length : "—"}</span>
        </button>
      </div>

      <p className="favorite-notice" role="status">{notice}</p>
      {!ready ? <p className="favorite-state" role="status">保存したお気に入りを確認しています。</p> : storageError ? (
        <div className="empty-state-card" role="status"><h2>保存内容を読み込めませんでした。</h2><p>ブラウザの保存設定をご確認ください。お気に入りは、このブラウザに保存されます。</p><div className="action-row"><Link href="/actors" className="action-button">キャスト一覧へ</Link><Link href="/plays" className="action-button">作品一覧へ</Link></div></div>
      ) : activeCount === 0 ? (
        <div className="empty-state-card">
          <span className="favorite-empty-heart" aria-hidden="true">♡</span>
          <h2>お気に入りはまだありません</h2>
          <p className="muted">俳優や作品の ♡ をタップして保存できます。</p>
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
        <section className="favorite-results favorite-results--actors" aria-label="お気に入りのキャスト">
          <h2>キャスト <span>{actors.length}件</span></h2>
          <div className="results-grid">
          {actors.map((actor) => (
            <article key={actor.slug} className="list-card">
              <div className="catalog-card__top">
                <Link href={`/actors/${actor.slug}`} className="cast-name favorite-actor-link">
                  <span className="favorite-initial" aria-hidden="true">{actor.name.slice(0, 1)}</span><span>{actor.name}{actor.kana ? <small>{actor.kana}</small> : null}<small className="favorite-open">出演作品を見る →</small></span>
                </Link>
                <div className="catalog-card__top-actions">
                  <button
                    type="button"
                    className="favorite-button favorite-button--sm is-active"
                    aria-label={`${actor.name}をお気に入りから外す`}
                    title="お気に入りから外す"
                    onClick={() => removeActor(actor.slug)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
          </div>
          <Link className="support-button support-button--outline" href="/actors">キャストをもっと探す →</Link>
        </section>
      ) : (
        <section className="favorite-results favorite-results--plays" aria-label="お気に入りの作品">
          <h2>作品 <span>{plays.length}件</span></h2>
          <div className="results-grid">
          {plays.map((play) => (
            <article key={play.slug} className="list-card">
              <div className="catalog-card__top">
                <Link href={`/plays/${play.slug}`} className="cast-name">
                  {play.title}<small className="favorite-open">作品詳細を見る →</small>
                </Link>
                <div className="catalog-card__top-actions">
                  <button
                    type="button"
                    className="favorite-button favorite-button--sm is-active"
                    aria-label={`${play.title}をお気に入りから外す`}
                    title="お気に入りから外す"
                    onClick={() => removePlay(play.slug)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {play.franchiseName ? <div className="muted">{play.franchiseName}</div> : null}
            </article>
          ))}
          </div>
          <Link className="support-button support-button--outline" href="/plays">作品をもっと探す →</Link>
        </section>
      )}
      <p className="favorite-storage-note">このブラウザに保存されます。端末間の共有はできません。ブラウザのデータを削除すると消えます。</p>
      <noscript><style>{".support-favorites .favorite-state { display: none; }"}</style><p>お気に入りを表示するにはJavaScriptを有効にしてください。</p><Link href="/actors">キャスト一覧へ</Link> / <Link href="/plays">作品一覧へ</Link></noscript>
    </div>
  );
}
