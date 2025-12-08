import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) 
      ? "text-neon-purple drop-shadow-[0_0_8px_rgba(180,108,255,0.5)] font-bold" 
      : "text-slate-400 hover:text-white hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]";
  };

  const mobileLinkStyle = (path: string) => `text-2xl font-bold tracking-widest uppercase transition-all duration-300 ${
    (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path))
      ? "text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink drop-shadow-[0_0_10px_rgba(180,108,255,0.5)]"
      : "text-slate-400 hover:text-white"
  }`;

  return (
    <div className="flex min-h-screen flex-col bg-theater-black text-slate-200 font-sans antialiased relative overflow-hidden">
      
      {/* Background Lighting Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-purple/5 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-pink/5 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-neon-purple/30 bg-black/60 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link to="/" className="group flex items-center gap-2 flex-shrink-0">
              <span className="text-xl font-extrabold tracking-tighter text-white group-hover:text-transparent bg-clip-text group-hover:bg-gradient-to-r group-hover:from-neon-purple group-hover:to-neon-pink transition-all duration-300">
                Stage Connect
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link 
                to="/actors" 
                className={`text-sm tracking-wide transition-all duration-300 ${isActive('/actors')}`}
              >
                キャスト
              </Link>
              <Link 
                to="/plays" 
                className={`text-sm tracking-wide transition-all duration-300 ${isActive('/plays')}`}
              >
                作品一覧
              </Link>
              <Link 
                to="/series" 
                className={`text-sm tracking-wide transition-all duration-300 ${isActive('/series')}`}
              >
                シリーズ
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Search Bar */}
             <SearchBar />

             {/* Favorites Link */}
             <Link 
                to="/favorites"
                className={`relative p-2 transition-colors ${isActive('/favorites')}`}
                aria-label="お気に入り"
             >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
             </Link>

             {/* Hamburger Button (Mobile) */}
             <button 
               onClick={() => setIsMenuOpen(true)}
               className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
               aria-label="メニューを開く"
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
               </svg>
             </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[100] bg-theater-black/95 backdrop-blur-xl transition-all duration-500 flex flex-col ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="container mx-auto px-6 h-full flex flex-col">
          {/* Menu Header */}
          <div className="h-14 md:h-16 flex items-center justify-between border-b border-white/10 shrink-0">
            <span className="text-xl font-extrabold tracking-tighter text-white">
              MENU
            </span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              aria-label="メニューを閉じる"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Menu Links */}
          <nav className="flex-1 flex flex-col justify-center items-center gap-10">
            <Link to="/" className={mobileLinkStyle('/')}>
              TOP
            </Link>
            <Link to="/actors" className={mobileLinkStyle('/actors')}>
              CAST
            </Link>
            <Link to="/plays" className={mobileLinkStyle('/plays')}>
              PLAYS
            </Link>
            <Link to="/series" className={mobileLinkStyle('/series')}>
              SERIES
            </Link>
            <Link to="/favorites" className={mobileLinkStyle('/favorites')}>
              FAVORITES
            </Link>
          </nav>
          
          <div className="pb-10 text-center shrink-0">
             <p className="text-xs text-slate-600 font-medium tracking-widest uppercase">
               Stage Connect
             </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10 animate-fade-in-up">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-theater-black py-10 mt-20 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs text-slate-600 font-medium tracking-widest uppercase">
            &copy; {new Date().getFullYear()} Stage Connect
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;