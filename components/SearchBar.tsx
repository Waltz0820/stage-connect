// src/components/SearchBar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { searchContent } from '../lib/utils/search';

type ActorLike = {
  slug: string;
  name: string;
  kana?: string | null;
};

type PlayLike = {
  slug: string;
  title: string;
  franchise?: string | null;
};

type SeriesLike = {
  // series/franchise のリンク先キー（slugがあればslug、なければname）
  key: string;
  name: string;
};

type SearchResultsLike = {
  actors: ActorLike[];
  plays: PlayLike[];
  // searchContent側が未対応でもOK（任意）
  series?: SeriesLike[];
};

const SUGGEST_LIMIT = 3;
const DEBOUNCE_MS = 120;

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultsLike>({ actors: [], plays: [], series: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // ページ遷移時に検索窓を閉じる
  useEffect(() => {
    setIsOpen(false);
    setIsMobileOpen(false);
    setQuery('');
    setResults({ actors: [], plays: [], series: [] });
  }, [location.pathname]);

  // クリックアウトで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (window.innerWidth < 768) setIsMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 検索（sync/async両対応 + デバウンス + 競合防止）
  const searchSeqRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  const runSearch = (q: string) => {
    const normalized = q.trim();
    if (!normalized) {
      setResults({ actors: [], plays: [], series: [] });
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    // debounce
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);

    const mySeq = ++searchSeqRef.current;
    setIsSearching(true);

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const maybe = searchContent(normalized) as any;
        const res = (await Promise.resolve(maybe)) as SearchResultsLike;

        // 競合防止：古い検索結果は捨てる
        if (mySeq !== searchSeqRef.current) return;

        setResults({
          actors: res?.actors ?? [],
          plays: res?.plays ?? [],
          series: (res as any)?.series ?? [],
        });
        setIsOpen(true);
      } catch (e) {
        if (mySeq !== searchSeqRef.current) return;
        console.warn('SearchBar search error:', e);
        setResults({ actors: [], plays: [], series: [] });
        setIsOpen(true);
      } finally {
        if (mySeq === searchSeqRef.current) setIsSearching(false);
      }
    }, DEBOUNCE_MS);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    runSearch(val);
  };

  const closeDropdown = () => setIsOpen(false);

  const openDropdownIfHasQuery = () => {
    if (query.trim()) setIsOpen(true);
  };

  const totalCount =
    (results.series?.length ?? 0) + (results.actors?.length ?? 0) + (results.plays?.length ?? 0);

  const shownCount =
    Math.min(results.series?.length ?? 0, SUGGEST_LIMIT) +
    Math.min(results.actors?.length ?? 0, SUGGEST_LIMIT) +
    Math.min(results.plays?.length ?? 0, SUGGEST_LIMIT);

  const hasAnyResults = totalCount > 0;

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
        type="button"
        onClick={() => {
          const next = !isMobileOpen;
          setIsMobileOpen(next);
          // モバイルオープン時にフォーカス
          setTimeout(() => {
            const input = containerRef.current?.querySelector('input');
            if (input && next) input.focus();
          }, 80);
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
          ${isMobileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4 md:translate-y-0 md:opacity-100 md:visible'}
        `}
      >
        <div className="relative group w-full md:w-64 lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-slate-500 group-focus-within:text-neon-purple transition-colors"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            type="text"
            value={query}
            onChange={handleSearch}
            onFocus={openDropdownIfHasQuery}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                goSearchPage();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
                if (window.innerWidth < 768) setIsMobileOpen(false);
              }
            }}
            placeholder="キャスト・作品・シリーズを検索..."
            className="block w-full pl-10 pr-10 py-2 border border-white/10 rounded-full leading-5 bg-black/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-theater-surface focus:ring-1 focus:ring-neon-purple focus:border-neon-purple/50 sm:text-sm transition-all shadow-[0_0_10px_rgba(0,0,0,0.2)] backdrop-blur-sm"
            aria-label="検索"
            autoComplete="off"
          />

          {/* 右側：ローディング or Enterヒント */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isSearching ? (
              <div className="w-4 h-4 rounded-full border border-white/20 border-t-neon-purple animate-spin" />
            ) : (
              <span className="text-[10px] text-slate-500 hidden md:inline">Enter</span>
            )}
          </div>

          {/* Neon Glow on Focus */}
          <div className="absolute inset-0 rounded-full ring-1 ring-neon-purple/0 group-focus-within:ring-neon-purple/30 group-focus-within:shadow-[0_0_15px_rgba(180,108,255,0.2)] pointer-events-none transition-all duration-300" />

          {/* Suggestions Dropdown */}
          {isOpen && query.trim().length > 0 && (
            <div className="absolute right-0 top-full mt-3 w-full md:w-96 bg-[#11111A] border border-neon-purple/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl animate-fade-in-up origin-top-right">
              {/* Header */}
              <div className="px-4 py-2 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Suggestions
                </div>
                <button
                  type="button"
                  onClick={goSearchPage}
                  className="text-[10px] font-bold uppercase tracking-widest text-neon-cyan hover:text-white transition-colors"
                >
                  検索結果へ →
                </button>
              </div>

              {/* No Results */}
              {!hasAnyResults && !isSearching && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  該当する結果が見つかりませんでした
                </div>
              )}

              {/* Series Section（任意） */}
              {(results.series?.length ?? 0) > 0 && (
                <div className="border-b border-white/5 last:border-0">
                  <div className="px-4 py-2 bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    シリーズ
                  </div>
                  <ul>
                    {results.series!.slice(0, SUGGEST_LIMIT).map((s) => (
                      <li key={s.key}>
                        <Link
                          to={`/series/${encodeURIComponent(s.key)}`}
                          onClick={() => {
                            closeDropdown();
                            if (window.innerWidth < 768) setIsMobileOpen(false);
                          }}
                          className="block px-4 py-3 hover:bg-neon-cyan/10 hover:text-white transition-colors group flex items-center justify-between"
                        >
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-slate-200 group-hover:text-neon-cyan truncate transition-colors">
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-500 group-hover:text-neon-cyan/70">
                              series
                            </span>
                          </div>
                          <svg
                            className="w-4 h-4 text-slate-600 group-hover:text-neon-cyan opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actors Section */}
              {(results.actors?.length ?? 0) > 0 && (
                <div className="border-b border-white/5 last:border-0">
                  <div className="px-4 py-2 bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    キャスト
                  </div>
                  <ul>
                    {results.actors.slice(0, SUGGEST_LIMIT).map((actor) => (
                      <li key={actor.slug}>
                        <Link
                          to={`/actors/${actor.slug}`}
                          onClick={() => {
                            closeDropdown();
                            if (window.innerWidth < 768) setIsMobileOpen(false);
                          }}
                          className="block px-4 py-3 hover:bg-neon-purple/10 hover:text-white transition-colors group flex items-center justify-between"
                        >
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-slate-200 group-hover:text-neon-purple transition-colors truncate">
                              {actor.name}
                            </span>
                            {!!actor.kana && (
                              <span className="text-[10px] text-slate-500 group-hover:text-neon-purple/70 truncate">
                                {actor.kana}
                              </span>
                            )}
                          </div>
                          <svg
                            className="w-4 h-4 text-slate-600 group-hover:text-neon-purple opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Plays Section */}
              {(results.plays?.length ?? 0) > 0 && (
                <div>
                  <div className="px-4 py-2 bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    作品
                  </div>
                  <ul>
                    {results.plays.slice(0, SUGGEST_LIMIT).map((play) => (
                      <li key={play.slug}>
                        <Link
                          to={`/plays/${play.slug}`}
                          onClick={() => {
                            closeDropdown();
                            if (window.innerWidth < 768) setIsMobileOpen(false);
                          }}
                          className="block px-4 py-3 hover:bg-neon-pink/10 hover:text-white transition-colors group flex items-center justify-between"
                        >
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-slate-200 group-hover:text-neon-pink truncate transition-colors">
                              {play.title}
                            </span>
                            {!!play.franchise && (
                              <span className="text-[10px] text-slate-500 group-hover:text-neon-pink/70 truncate">
                                {play.franchise}
                              </span>
                            )}
                          </div>
                          <svg
                            className="w-4 h-4 text-slate-600 group-hover:text-neon-pink opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer: “すべての結果を見る” */}
              <div className="px-4 py-2 text-center border-t border-white/5 bg-black/20">
                <Link
                  to={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => {
                    closeDropdown();
                    if (window.innerWidth < 768) setIsMobileOpen(false);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white font-bold tracking-widest uppercase"
                >
                  すべての結果を見る（全{totalCount}件）
                  {totalCount > shownCount ? ` / 非表示 ${totalCount - shownCount}件` : ''}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
