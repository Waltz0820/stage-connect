// src/components/SearchBar.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type ActorRow = {
  id: string;
  slug: string;
  name: string;
  kana?: string | null;
};

type PlayRow = {
  id: string;
  slug: string;
  title: string;
  franchise?: string | null;
};

type SearchResults = {
  actors: ActorRow[];
  plays: PlayRow[];
};

const DEBOUNCE_MS = 180;
const ACTORS_LIMIT = 5;
const PLAYS_LIMIT = 5;

// Supabase の or(...) 用に最低限安全にする（カンマは区切りとして致命的なので潰す）
const sanitizeForOr = (s: string) => s.replace(/,/g, " ").trim();
const escapeLike = (s: string) => s.replace(/[%_]/g, "\\$&"); // % _ をエスケープ

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ actors: [], plays: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // ページ遷移時に検索窓を閉じる
  useEffect(() => {
    setIsOpen(false);
    setIsMobileOpen(false);
    setQuery("");
    setResults({ actors: [], plays: [] });
  }, [location.pathname]);

  // クリックアウトで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (window.innerWidth < 768) setIsMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results.actors.length > 0 || results.plays.length > 0;

  // debounce + 競合防止
  const seqRef = useRef(0);
  useEffect(() => {
    const q = query.trim();
    const mySeq = ++seqRef.current;

    if (!q) {
      setResults({ actors: [], plays: [] });
      setIsOpen(false);
      return;
    }

    const t = window.setTimeout(async () => {
      try {
        const term = escapeLike(sanitizeForOr(q));
        const like = `%${term}%`;

        const [aRes, pRes] = await Promise.all([
          supabase
            .from("actors")
            .select("id, slug, name, kana")
            .or(`name.ilike.${like},kana.ilike.${like}`)
            .order("name", { ascending: true })
            .limit(ACTORS_LIMIT),

          supabase
            .from("plays")
            .select("id, slug, title, franchise")
            .or(`title.ilike.${like},franchise.ilike.${like}`)
            .order("title", { ascending: true })
            .limit(PLAYS_LIMIT),
        ]);

        if (mySeq !== seqRef.current) return;

        if (aRes.error) console.warn("[searchbar actors] error", aRes.error);
        if (pRes.error) console.warn("[searchbar plays] error", pRes.error);

        setResults({
          actors: ((aRes.data as any) ?? []) as ActorRow[],
          plays: ((pRes.data as any) ?? []) as PlayRow[],
        });
        setIsOpen(true);
      } catch (e) {
        console.warn("[searchbar] error", e);
        if (mySeq === seqRef.current) {
          setResults({ actors: [], plays: [] });
          setIsOpen(true);
        }
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(t);
  }, [query]);

  const goSearchPage = () => {
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setIsOpen(false);
    setIsMobileOpen(false);
  };

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Mobile Toggle Icon */}
      <button
        onClick={() => {
          setIsMobileOpen(!isMobileOpen);
          setTimeout(() => {
            const input = containerRef.current?.querySelector("input");
            if (input && !isMobileOpen) input.focus();
          }, 100);
        }}
        className="md:hidden p-2 text-slate-300 hover:text-neon-purple transition-colors"
        aria-label="検索を開く"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Input Field Container */}
      <div
        className={`
          fixed left-0 right-0 top-[3.5rem] w-full px-4
          md:static md:w-auto md:mt-0 md:px-0
          transition-all duration-300 origin-top
          ${isMobileOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-4 md:translate-y-0 md:opacity-100 md:visible"}
        `}
      >
        <div className="relative group w-full md:w-64 lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-500 group-focus-within:text-neon-purple transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                goSearchPage();
              }
              if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
            placeholder="キャスト・作品を検索..."
            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-black/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-theater-surface focus:ring-1 focus:ring-neon-purple focus:border-neon-purple/50 sm:text-sm transition-all shadow-[0_0_10px_rgba(0,0,0,0.2)] backdrop-blur-sm"
          />

          {/* Neon Glow on Focus */}
          <div className="absolute inset-0 rounded-full ring-1 ring-neon-purple/0 group-focus-within:ring-neon-purple/30 group-focus-within:shadow-[0_0_15px_rgba(180,108,255,0.2)] pointer-events-none transition-all duration-300" />

          {/* Suggestions Dropdown */}
          {isOpen && query.trim().length > 0 && (
            <div className="absolute right-0 top-full mt-3 w-full md:w-96 bg-[#11111A] border border-neon-purple/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl animate-fade-in-up origin-top-right">
              {/* No Results */}
              {!hasResults && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  該当するキャスト・作品が見つかりませんでした
                </div>
              )}

              {/* Actors Section */}
              {results.actors.length > 0 && (
                <div className="border-b border-white/5 last:border-0">
                  <div className="px-4 py-2 bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    キャスト
                  </div>
                  <ul>
                    {results.actors.map((actor) => (
                      <li key={actor.id}>
                        <Link
                          to={`/actors/${actor.slug}`}
                          className="block px-4 py-3 hover:bg-neon-purple/10 hover:text-white transition-colors group flex items-center justify-between"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-200 group-hover:text-neon-purple transition-colors">
                              {actor.name}
                            </span>
                            {actor.kana && (
                              <span className="text-[10px] text-slate-500 group-hover:text-neon-purple/70">
                                {actor.kana}
                              </span>
                            )}
                          </div>
                          <svg className="w-4 h-4 text-slate-600 group-hover:text-neon-purple opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Plays Section */}
              {results.plays.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    作品
                  </div>
                  <ul>
                    {results.plays.map((play) => (
                      <li key={play.id}>
                        <Link
                          to={`/plays/${play.slug}`}
                          className="block px-4 py-3 hover:bg-neon-pink/10 hover:text-white transition-colors group flex items-center justify-between"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-slate-200 group-hover:text-neon-pink truncate transition-colors">
                              {play.title}
                            </span>
                            {play.franchise && (
                              <span className="text-[10px] text-slate-500 group-hover:text-neon-pink/70">
                                {play.franchise}
                              </span>
                            )}
                          </div>
                          <svg className="w-4 h-4 text-slate-600 group-hover:text-neon-pink opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer: go to search page */}
              <div className="px-4 py-3 border-t border-white/5 bg-black/20">
                <button
                  onClick={goSearchPage}
                  className="w-full px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
                >
                  すべての検索結果を見る →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
