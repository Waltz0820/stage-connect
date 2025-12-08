import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { searchContent, SearchResults } from '../lib/utils/search';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ actors: [], plays: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // ページ遷移時に検索窓を閉じる
  useEffect(() => {
    setIsOpen(false);
    setIsMobileOpen(false);
    setQuery('');
  }, [location.pathname]);

  // クリックアウトで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (window.innerWidth >= 768) {
           // Desktopではinputを表示したままにするが、dropdownは閉じる
        } else {
           // Mobileでは閉じる
           setIsMobileOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 0) {
      const res = searchContent(val);
      setResults(res);
      setIsOpen(true);
    } else {
      setResults({ actors: [], plays: [] });
      setIsOpen(false);
    }
  };

  const hasResults = results.actors.length > 0 || results.plays.length > 0;

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Mobile Toggle Icon */}
      <button
        onClick={() => {
            setIsMobileOpen(!isMobileOpen);
            // モバイルオープン時にフォーカスするための処理などをここに入れても良い
            setTimeout(() => {
                const input = containerRef.current?.querySelector('input');
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
      <div className={`
        fixed left-0 right-0 top-[3.5rem] w-full px-4
        md:static md:w-auto md:mt-0 md:px-0
        transition-all duration-300 origin-top
        ${isMobileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4 md:translate-y-0 md:opacity-100 md:visible'}
      `}>
        <div className="relative group w-full md:w-64 lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-500 group-focus-within:text-neon-purple transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            onFocus={() => { if(query) setIsOpen(true); }}
            placeholder="キャスト・作品を検索..."
            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-black/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-theater-surface focus:ring-1 focus:ring-neon-purple focus:border-neon-purple/50 sm:text-sm transition-all shadow-[0_0_10px_rgba(0,0,0,0.2)] backdrop-blur-sm"
          />
          
          {/* Neon Glow on Focus */}
          <div className="absolute inset-0 rounded-full ring-1 ring-neon-purple/0 group-focus-within:ring-neon-purple/30 group-focus-within:shadow-[0_0_15px_rgba(180,108,255,0.2)] pointer-events-none transition-all duration-300"></div>

          {/* Suggestions Dropdown */}
          {isOpen && (query.length > 0) && (
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
                    {results.actors.slice(0, 3).map((actor) => (
                      <li key={actor.slug}>
                        <Link
                          to={`/actors/${actor.slug}`}
                          className="block px-4 py-3 hover:bg-neon-purple/10 hover:text-white transition-colors group flex items-center justify-between"
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
                    {results.plays.slice(0, 3).map((play) => (
                      <li key={play.slug}>
                        <Link
                          to={`/plays/${play.slug}`}
                          className="block px-4 py-3 hover:bg-neon-pink/10 hover:text-white transition-colors group flex items-center justify-between"
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
              
              {(results.actors.length > 3 || results.plays.length > 3) && (
                   <div className="px-4 py-2 text-center border-t border-white/5 bg-black/20">
                      <span className="text-[10px] text-slate-500">
                          ...他 {Math.max(0, results.actors.length - 3) + Math.max(0, results.plays.length - 3)} 件の結果
                      </span>
                   </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;