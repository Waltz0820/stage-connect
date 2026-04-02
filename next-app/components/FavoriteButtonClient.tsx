"use client";

import { useEffect, useMemo, useState } from "react";

type FavoriteType = "actor" | "play";

type StoredFavorite =
  | string
  | {
      slug: string;
      name?: string | null;
      kana?: string | null;
      title?: string | null;
      franchiseName?: string | null;
    };

const storageKeyByType: Record<FavoriteType, string> = {
  actor: "favorite_actors",
  play: "favorite_plays",
};

type Props = {
  slug: string;
  type: FavoriteType;
  size?: "sm" | "md" | "lg";
  className?: string;
  name?: string | null;
  kana?: string | null;
  title?: string | null;
  franchiseName?: string | null;
};

const sizeClassMap = {
  sm: "favorite-button--sm",
  md: "favorite-button--md",
  lg: "favorite-button--lg",
};

const readFavoriteSlugs = (storageKey: string) => {
  const raw = window.localStorage.getItem(storageKey);
  const list = raw ? (JSON.parse(raw) as StoredFavorite[]) : [];
  return list.map((item) => (typeof item === "string" ? item : String(item?.slug ?? "").trim())).filter(Boolean);
};

export function FavoriteButtonClient({
  slug,
  type,
  size = "md",
  className = "",
  name,
  kana,
  title,
  franchiseName,
}: Props) {
  const storageKey = storageKeyByType[type];
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setIsActive(readFavoriteSlugs(storageKey).includes(slug));
      } catch {
        setIsActive(false);
      }
    };

    sync();
    window.addEventListener("favorites-updated", sync);
    return () => window.removeEventListener("favorites-updated", sync);
  }, [slug, storageKey]);

  const label = useMemo(() => (isActive ? "お気に入りから外す" : "お気に入りに追加"), [isActive]);

  const onToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const raw = window.localStorage.getItem(storageKey);
      const current = raw ? (JSON.parse(raw) as StoredFavorite[]) : [];
      const isStored = current.some((item) => (typeof item === "string" ? item : item?.slug) === slug);
      const next = isStored
        ? current.filter((item) => (typeof item === "string" ? item : item?.slug) !== slug)
        : [
            ...current.filter(Boolean),
            type === "actor"
              ? { slug, name: name ?? slug, kana: kana ?? null }
              : { slug, title: title ?? slug, franchiseName: franchiseName ?? null },
          ];

      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setIsActive(!isStored);
      window.dispatchEvent(new Event("favorites-updated"));
    } catch {
      // no-op
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={[
        "favorite-button",
        sizeClassMap[size],
        isActive ? "is-active" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
