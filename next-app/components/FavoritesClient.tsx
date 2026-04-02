"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

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

export function FavoritesClient() {
  const [tab, setTab] = useState<"actors" | "plays">("actors");
  const [actors, setActors] = useState<ActorFavorite[]>([]);
  const [plays, setPlays] = useState<PlayFavorite[]>([]);

  useEffect(() => {
    const sync = async () => {
      try {
        const actorSlugs = JSON.parse(window.localStorage.getItem("favorite_actors") || "[]") as string[];
        const playSlugs = JSON.parse(window.localStorage.getItem("favorite_plays") || "[]") as string[];
        const supabase = getSupabaseBrowserClient();

        if (actorSlugs.length > 0) {
          const { data } = await supabase
            .from("actors")
            .select("slug, name, kana")
            .in("slug", actorSlugs);
          const rows = ((data ?? []) as any[]).map((row) => ({
            slug: String(row?.slug ?? "").trim(),
            name: String(row?.name ?? "").trim(),
            kana: (row?.kana as string | null) ?? null,
          }));
          const order = new Map(actorSlugs.map((slug, index) => [slug, index]));
          rows.sort((a, b) => (order.get(a.slug) ?? 9999) - (order.get(b.slug) ?? 9999));
          setActors(rows.filter((row) => row.slug && row.name));
        } else {
          setActors([]);
        }

        if (playSlugs.length > 0) {
          const { data } = await supabase
            .from("plays")
            .select("slug, title, franchise:franchises(name)")
            .in("slug", playSlugs);
          const rows = ((data ?? []) as any[]).map((row) => {
            const franchise = Array.isArray(row?.franchise) ? row.franchise[0] : row?.franchise;
            return {
              slug: String(row?.slug ?? "").trim(),
              title: String(row?.title ?? "").trim(),
              franchiseName: franchise?.name ?? null,
            };
          });
          const order = new Map(playSlugs.map((slug, index) => [slug, index]));
          rows.sort((a, b) => (order.get(a.slug) ?? 9999) - (order.get(b.slug) ?? 9999));
          setPlays(rows.filter((row) => row.slug && row.title));
        } else {
          setPlays([]);
        }
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
        <p className="muted">保存したキャストと作品をあとからまとめて見返せます。</p>
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
