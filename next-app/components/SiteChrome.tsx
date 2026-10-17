"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchBarClient } from "./SearchBarClient";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { StreamingClickTracker } from "./StreamingClickTracker";
import { getLanguageTargets, isAdminPath } from "../lib/locale-routing";

const copy = {
  ja: {
    home: { href: "/", label: "TOP" },
    primaryNav: [
      { href: "/actors", label: "俳優" },
      { href: "/plays", label: "作品" },
      { href: "/series", label: "シリーズ" },
      { href: "/watch", label: "配信" },
      { href: "/guide", label: "ガイド" },
    ],
    mobileNavExtra: [
      { href: "/favorites", label: "お気に入り" },
    ],
    favorites: "お気に入り",
    globalNavLabel: "グローバルナビゲーション",
    mobileNavLabel: "モバイルナビゲーション",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
    footerContent: "コンテンツ",
    footerWatch: "配信で観る",
    plays: "作品一覧",
    actors: "俳優一覧",
    series: "シリーズ一覧",
    guide: "ガイド / コラム",
    watch: "配信サービス一覧",
    contact: "お問い合わせ",
    privacy: "プライバシーポリシー",
    footerCopy: "2.5次元舞台とキャストをつなぐデジタルアーカイブ。",
    ctaButton: "DMMプレミアム",
    localeLabel: "言語切替",
  },
  en: {
    home: { href: "/en", label: "HOME" },
    primaryNav: [
      { href: "/en/actors", label: "Actors" },
      { href: "/en/plays", label: "Plays" },
      { href: "/en/series", label: "Series" },
      { href: "/watch", label: "Streaming" },
      { href: "/guide", label: "Guides" },
    ],
    mobileNavExtra: [
      { href: "/favorites", label: "Favorites" },
    ],
    favorites: "Favorites",
    globalNavLabel: "Global navigation",
    mobileNavLabel: "Mobile navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    footerContent: "Content",
    footerWatch: "Streaming",
    plays: "Browse Plays",
    actors: "Browse Actors",
    series: "Browse Series",
    guide: "Guides / Columns",
    watch: "Streaming Guides",
    contact: "Contact",
    privacy: "Privacy Policy",
    footerCopy: "A digital archive connecting 2.5D stage productions and cast history.",
    ctaButton: "DMM Premium",
    localeLabel: "Language switcher",
  },
} as const;

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return <>{children}</>;
  return <PublicSiteChrome pathname={pathname}>{children}</PublicSiteChrome>;
}

function PublicSiteChrome({ pathname, children }: { pathname: string | null; children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { locale } = getLanguageTargets(pathname);
  const labels = copy[locale];
  const mobileNav = [labels.home, ...labels.primaryNav, ...labels.mobileNavExtra];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsMenuOpen(false); menuButtonRef.current?.focus(); }
      if (event.key !== 'Tab') return;
      const items = menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (!menuRef.current?.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  const mobileFooterYear = useMemo(() => new Date().getFullYear(), []);
  const isActive = (href: string) => (href === "/" || href === "/en" ? pathname === href : Boolean(pathname?.startsWith(href)));

  const localeSwitcher = <LocaleSwitcher pathname={pathname}/>;

  return (
    <div className="page-shell stage-v2">
      <StreamingClickTracker/>
      <a className="skip-link" href="#main-content">{locale === 'en' ? 'Skip to content' : '本文へ移動'}</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <div className="site-header__left">
            <Link href={locale === "en" ? "/en" : "/"} className="site-brand">
              STAGE CONNECT
              <span className="site-brand__tagline">{locale === "ja" ? "2.5次元舞台とキャストをつなぐ" : "Connecting 2.5D stage and cast"}</span>
            </Link>
            <nav className="site-nav desktop-nav" aria-label={labels.globalNavLabel} data-streaming-placement="header">
              {labels.primaryNav.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className={isActive(item.href) ? "is-active" : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="site-header__actions">
            {localeSwitcher}
            <SearchBarClient />
            <Link href="/favorites" className={`header-utility ${isActive("/favorites") ? "is-active" : ""}`}>
              {labels.favorites}
            </Link>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="site-menu-button"
            onClick={() => setIsMenuOpen(true)}
            aria-label={labels.openMenu}
            aria-expanded={isMenuOpen}
            aria-controls="site-navigation"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </header>

      <div ref={menuRef} id="site-navigation" className={`mobile-menu ${isMenuOpen ? "is-open" : ""}`} role="dialog" aria-modal={isMenuOpen ? true : undefined} aria-label={labels.mobileNavLabel} aria-hidden={!isMenuOpen} inert={!isMenuOpen}
        onTransitionEnd={event => {
          if (isMenuOpen && event.target === event.currentTarget && !menuRef.current?.contains(document.activeElement)) closeButtonRef.current?.focus();
        }}>
        <div className="container mobile-menu__inner">
          <div className="mobile-menu__header">
            <span className="mobile-menu__title">MENU</span>
            <button
              ref={closeButtonRef}
              type="button"
              className="mobile-menu__close"
              onClick={() => { setIsMenuOpen(false); menuButtonRef.current?.focus(); }}
              aria-label={labels.closeMenu}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mobile-menu__locale">{localeSwitcher}</div>

          <nav className="mobile-menu__nav" aria-label={labels.mobileNavLabel} data-streaming-placement="mobile_menu">
            {mobileNav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className={isActive(item.href) ? "is-active" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-menu__footer">
            <p>Stage Connect</p>
          </div>
        </div>
      </div>

      <div id="main-content" className="site-content" tabIndex={-1}>{children}</div>

      <footer className="site-footer" data-streaming-placement="footer">
        <div className="container site-footer__upper">
          <div className="site-footer__grid">
            <section className="site-footer__column">
              <h3>{labels.footerContent}</h3>
              <ul>
                <li><Link href={locale === "en" ? "/en/plays" : "/plays"}>{labels.plays}</Link></li>
                <li><Link href={locale === "en" ? "/en/actors" : "/actors"}>{labels.actors}</Link></li>
                <li><Link href={locale === "en" ? "/en/series" : "/series"}>{labels.series}</Link></li>
                <li><Link href="/guide">{labels.guide}</Link></li>
                <li><Link href="/favorites">{labels.favorites}</Link></li>
              </ul>
            </section>

            <section className="site-footer__column">
              <h3>{labels.footerWatch}</h3>
              <ul>
                <li><Link href="/watch">{labels.watch}</Link></li>
                <li><Link href="/watch/dmm">DMM TV</Link></li>
                <li>
                  <a
                    href="https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text"
                    rel="sponsored noopener"
                    target="_blank"
                  >
                    {labels.ctaButton}
                  </a>
                </li>
                <li><Link href="/contact">{labels.contact}</Link></li>
                <li><Link href="/privacy">{labels.privacy}</Link></li>
              </ul>
            </section>
          </div>
        </div>

        <div className="site-footer__lower">
          <div className="container site-footer__meta">
            <p>&copy; {mobileFooterYear} Stage Connect</p>
            <p>{labels.footerCopy}</p>
            <div className="site-footer__locale">
              {localeSwitcher}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
