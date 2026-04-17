"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getEnglishActorName, getEnglishPlayTitle, getEnglishSeriesName } from "../lib/en-copy";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

type ActorRow = {
  id: string;
  slug: string;
  name: string;
  nameEn?: string | null;
  kana?: string | null;
};

type PlayRow = {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  franchise?: { name?: string | null; nameEn?: string | null } | { name?: string | null; nameEn?: string | null }[] | null;
};

type SeriesRow = {
  id: string;
  slug: string;
  name: string;
  nameEn?: string | null;
};

const DEBOUNCE_MS = 180;
const LIMIT = 5;

const normalizeSearchQuery = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/\u3000/g, " ")
    .trim();

const sanitizeForOr = (value: string) => value.replace(/,/g, " ").trim();
const escapeLike = (value: string) => value.replace(/[%_]/g, "\\$&").trim();
const stripSearchSpaces = (value: string) => value.replace(/[\s\u3000]+/g, "");
const buildLooseLike = (value: string) => {
  const compact = stripSearchSpaces(value);
  if (!compact) return "";
  return `%${compact.split("").map((char) => escapeLike(char)).join("%")}%`;
};

export function SearchBarClient() {
  const router = useRouter();
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith("/en");
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [actors, setActors] = useState<ActorRow[]>([]);
  const [plays, setPlays] = useState<Array<{ id: string; slug: string; title: string; franchise: string | null }>>(
    []
  );
  const [series, setSeries] = useState<SeriesRow[]>([]);

  useEffect(() => {
    setQuery("");
    setActors([]);
    setPlays([]);
    setSeries([]);
    setIsOpen(false);
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const q = normalizeSearchQuery(query);
    if (!q) {
      setActors([]);
      setPlays([]);
      setSeries([]);
      setIsOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      const termForOr = escapeLike(sanitizeForOr(q));
      const like = `%${termForOr}%`;
      const looseLike = buildLooseLike(q);
      const actorOr =
        looseLike && looseLike !== like
          ? `name.ilike.${like},kana.ilike.${like},slug.ilike.${like},name.ilike.${looseLike},kana.ilike.${looseLike},slug.ilike.${looseLike}`
          : `name.ilike.${like},kana.ilike.${like},slug.ilike.${like}`;
      const playOr =
        looseLike && looseLike !== like
          ? `title.ilike.${like},slug.ilike.${like},title.ilike.${looseLike},slug.ilike.${looseLike}`
          : `title.ilike.${like},slug.ilike.${like}`;
      const seriesOr =
        looseLike && looseLike !== like
          ? `name.ilike.${like},slug.ilike.${like},name.ilike.${looseLike},slug.ilike.${looseLike}`
          : `name.ilike.${like},slug.ilike.${like}`;

      const [actorRes, playRes, seriesRes] = await Promise.all([
        supabase
          .from("actors")
          .select("id, slug, name, kana")
          .or(actorOr)
          .order("name", { ascending: true })
          .limit(LIMIT),
        supabase
          .from("plays")
          .select("id, slug, title, title_en, franchise:franchises(name,name_en)")
          .or(playOr)
          .order("title", { ascending: true })
          .limit(LIMIT),
        supabase
          .from("franchises")
          .select("id, slug, name, name_en")
          .or(seriesOr)
          .order("name", { ascending: true })
          .limit(LIMIT),
      ]);

      setActors(((actorRes.data ?? []) as ActorRow[]).filter((row) => row.slug && row.name));
      setPlays(
        ((playRes.data ?? []) as PlayRow[])
          .map((row) => {
            const franchise = Array.isArray(row.franchise) ? row.franchise[0] : row.franchise;
            return {
              id: row.id,
              slug: row.slug,
              title: getEnglishPlayTitle(row),
              franchise: franchise ? getEnglishSeriesName(franchise) : null,
            };
          })
          .filter((row) => row.slug && row.title)
      );
      setSeries(
        ((seriesRes.data ?? []) as SeriesRow[]).filter((row) => row.id && row.slug && row.name)
      );
      setIsOpen(true);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  const submit = () => {
    const q = normalizeSearchQuery(query);
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setIsOpen(false);
    setIsMobileOpen(false);
  };

  const hasResults = actors.length > 0 || plays.length > 0 || series.length > 0;
  const playHrefBase = isEnglish ? "/en/plays" : "/plays";
  const actorHrefBase = isEnglish ? "/en/actors" : "/actors";
  const seriesHrefBase = isEnglish ? "/en/series" : "/series";

  return (
    <div className="search-shell" ref={rootRef}>
      <button
        type="button"
        className="search-toggle"
        onClick={() => setIsMobileOpen((current) => !current)}
        aria-label={isEnglish ? "Open search" : "検索を開く"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <div className={`search-panel ${isMobileOpen ? "is-open" : ""}`}>
        <div className="search-input-wrap">
          <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
              if (event.key === "Escape") {
                setIsOpen(false);
                setIsMobileOpen(false);
              }
            }}
            placeholder={isEnglish ? "Search actors or plays..." : "キャスト・作品を検索..."}
            className="search-input"
          />
        </div>

        {isOpen && query.trim() ? (
          <div className="search-dropdown">
            {!hasResults ? (
              <div className="search-empty">
                {isEnglish ? "No search results found." : "検索結果が見つかりませんでした"}
              </div>
            ) : null}

            {actors.length > 0 ? (
              <div className="search-group">
                <div className="search-group-title">{isEnglish ? "Actors" : "キャスト"}</div>
                {actors.map((actor) => (
                  <Link
                    key={actor.id}
                    href={`${actorHrefBase}/${actor.slug}`}
                    className="search-item"
                    onClick={() => {
                      setIsOpen(false);
                      setIsMobileOpen(false);
                    }}
                  >
                    <span>
                      <strong>{isEnglish ? getEnglishActorName(actor) : actor.name}</strong>
                      {actor.kana ? <span className="search-item-sub">{actor.kana}</span> : null}
                    </span>
                    <span className="search-item-arrow">→</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {plays.length > 0 ? (
              <div className="search-group">
                <div className="search-group-title">{isEnglish ? "Plays" : "作品"}</div>
                {plays.map((play) => (
                  <Link
                    key={play.id}
                    href={`${playHrefBase}/${play.slug}`}
                    className="search-item"
                    onClick={() => {
                      setIsOpen(false);
                      setIsMobileOpen(false);
                    }}
                  >
                    <span>
                      <strong>{play.title}</strong>
                      {play.franchise ? <span className="search-item-sub">{play.franchise}</span> : null}
                    </span>
                    <span className="search-item-arrow">→</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {series.length > 0 ? (
              <div className="search-group">
                <div className="search-group-title">{isEnglish ? "Series" : "シリーズ"}</div>
                {series.map((item) => (
                  <Link
                    key={item.id}
                    href={`${seriesHrefBase}/${item.slug}`}
                    className="search-item"
                    onClick={() => {
                      setIsOpen(false);
                      setIsMobileOpen(false);
                    }}
                  >
                    <span>
                      <strong>{isEnglish ? getEnglishSeriesName(item) : item.name}</strong>
                    </span>
                    <span className="search-item-arrow">→</span>
                  </Link>
                ))}
              </div>
            ) : null}

            <button type="button" className="search-submit" onClick={submit}>
              {isEnglish ? "View all results" : "すべての検索結果を見る"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
