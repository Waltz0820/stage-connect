"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import FloatingCTA from "./FloatingCTA";
import { SearchBarClient } from "./SearchBarClient";

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
      { href: "/tags", label: "タグ" },
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
    tags: "タグ一覧",
    watch: "配信サービス一覧",
    privacy: "プライバシーポリシー",
    footerCopy: "2.5次元舞台とキャストをつなぐデジタルアーカイブ。",
    ctaLabel: "2.5次元舞台を今すぐ観る",
    ctaSubText: "POPULAR",
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
      { href: "/tags", label: "Tags" },
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
    tags: "Browse Tags",
    watch: "Streaming Guides",
    privacy: "Privacy Policy",
    footerCopy: "A digital archive connecting 2.5D stage productions and cast history.",
    ctaLabel: "Watch 2.5D stage productions now",
    ctaSubText: "POPULAR",
    ctaButton: "DMM Premium",
    localeLabel: "Language switcher",
  },
} as const;

type LocaleKey = keyof typeof copy;

function getLanguageTargets(pathname: string | null) {
  if (!pathname) {
    return { locale: "ja" as const, jaHref: "/", enHref: "/en", enAvailable: true };
  }

  if (pathname === "/en") {
    return { locale: "en" as const, jaHref: "/", enHref: "/en", enAvailable: true };
  }

  if (pathname.startsWith("/en/")) {
    return {
      locale: "en" as const,
      jaHref: pathname.replace(/^\/en/, "") || "/",
      enHref: pathname,
      enAvailable: true,
    };
  }

  const englishCompatible =
    pathname === "/" ||
    pathname === "/plays" ||
    pathname.startsWith("/plays/") ||
    pathname === "/series" ||
    pathname.startsWith("/series/");

  return {
    locale: "ja" as const,
    jaHref: pathname,
    enHref: pathname === "/" ? "/en" : `/en${pathname}`,
    enAvailable: englishCompatible,
  };
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  const { locale, jaHref, enHref, enAvailable } = getLanguageTargets(pathname);
  const labels = copy[locale];
  const mobileNav = [labels.home, ...labels.primaryNav, ...labels.mobileNavExtra];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const idleMs = 1500;
    const minScroll = 80;

    const handleScroll = () => {
      setShowCTA(false);

      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        if (window.scrollY > minScroll) {
          setShowCTA(true);
        }
      }, idleMs);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const mobileFooterYear = useMemo(() => new Date().getFullYear(), []);
  const isActive = (href: string) => (href === "/" || href === "/en" ? pathname === href : Boolean(pathname?.startsWith(href)));

  const localeSwitcher = (
    <div className="locale-switcher" aria-label={labels.localeLabel}>
      {locale === "en" ? (
        <Link href={jaHref} className="locale-switcher__link">
          JP
        </Link>
      ) : (
        <span className="locale-switcher__current">JP</span>
      )}

      {enAvailable ? (
        locale === "en" ? (
          <span className="locale-switcher__current">EN</span>
        ) : (
          <Link href={enHref} className="locale-switcher__link">
            EN
          </Link>
        )
      ) : (
        <span className="locale-switcher__disabled">EN</span>
      )}
    </div>
  );

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <div className="site-header__left">
            <Link href={locale === "en" ? "/en" : "/"} className="site-brand">
              STAGE <span>CONNECT</span>
            </Link>
            <nav className="site-nav desktop-nav" aria-label={labels.globalNavLabel}>
              {labels.primaryNav.map((item) => (
                <Link key={item.href} href={item.href} className={isActive(item.href) ? "is-active" : undefined}>
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
            type="button"
            className="site-menu-button"
            onClick={() => setIsMenuOpen(true)}
            aria-label={labels.openMenu}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${isMenuOpen ? "is-open" : ""}`}>
        <div className="container mobile-menu__inner">
          <div className="mobile-menu__header">
            <span className="mobile-menu__title">MENU</span>
            <button
              type="button"
              className="mobile-menu__close"
              onClick={() => setIsMenuOpen(false)}
              aria-label={labels.closeMenu}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mobile-menu__locale">{localeSwitcher}</div>

          <nav className="mobile-menu__nav" aria-label={labels.mobileNavLabel}>
            {mobileNav.map((item) => (
              <Link key={item.href} href={item.href} className={isActive(item.href) ? "is-active" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-menu__footer">
            <p>Stage Connect</p>
          </div>
        </div>
      </div>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container site-footer__upper">
          <div className="site-footer__grid">
            <section className="site-footer__column">
              <h3>{labels.footerContent}</h3>
              <ul>
                <li><Link href={locale === "en" ? "/en/plays" : "/plays"}>{labels.plays}</Link></li>
                <li><Link href={locale === "en" ? "/en/actors" : "/actors"}>{labels.actors}</Link></li>
                <li><Link href={locale === "en" ? "/en/series" : "/series"}>{labels.series}</Link></li>
                <li><Link href="/guide">{labels.guide}</Link></li>
                <li><Link href="/tags">{labels.tags}</Link></li>
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

      <FloatingCTA
        url="https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text"
        label={labels.ctaLabel}
        subText={labels.ctaSubText}
        buttonText={labels.ctaButton}
        visible={locale === "ja" && showCTA}
      />
    </div>
  );
}
