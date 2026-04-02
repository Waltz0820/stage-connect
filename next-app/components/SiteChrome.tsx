"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import FloatingCTA from "./FloatingCTA";
import { SearchBarClient } from "./SearchBarClient";

const primaryNav = [
  { href: "/actors", label: "俳優" },
  { href: "/plays", label: "作品" },
  { href: "/series", label: "シリーズ" },
  { href: "/watch", label: "配信" },
  { href: "/guide", label: "ガイド" },
];

const mobileNav = [
  { href: "/", label: "TOP" },
  ...primaryNav,
  { href: "/favorites", label: "お気に入り" },
  { href: "/tags", label: "タグ" },
];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

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

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        if (window.scrollY > minScroll) {
          setShowCTA(true);
        }
      }, idleMs);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const mobileFooterYear = useMemo(() => new Date().getFullYear(), []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <div className="site-header__left">
            <Link href="/" className="site-brand">
              STAGE <span>CONNECT</span>
            </Link>
            <nav className="site-nav desktop-nav" aria-label="グローバルナビゲーション">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? "is-active" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="site-header__actions">
            <SearchBarClient />
            <Link href="/favorites" className={`header-utility ${isActive("/favorites") ? "is-active" : ""}`}>
              お気に入り
            </Link>
          </div>

          <button
            type="button"
            className="site-menu-button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="メニューを開く"
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
              aria-label="メニューを閉じる"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="mobile-menu__nav" aria-label="モバイルナビゲーション">
            {mobileNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "is-active" : undefined}
              >
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
              <h3>コンテンツ</h3>
              <ul>
                <li><Link href="/plays">作品一覧</Link></li>
                <li><Link href="/actors">キャスト一覧</Link></li>
                <li><Link href="/series">シリーズ一覧</Link></li>
                <li><Link href="/tags">タグ一覧</Link></li>
                <li><Link href="/favorites">お気に入り</Link></li>
              </ul>
            </section>

            <section className="site-footer__column">
              <h3>配信で観る</h3>
              <ul>
                <li><Link href="/watch">配信サービス一覧</Link></li>
                <li><Link href="/watch/dmm">DMM TV</Link></li>
                <li>
                  <a
                    href="https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text"
                    rel="sponsored noopener"
                    target="_blank"
                  >
                    DMMプレミアム
                  </a>
                </li>
              </ul>
            </section>

            <section className="site-footer__column">
              <h3>サイト情報</h3>
              <ul>
                <li><Link href="/guide">ガイド / コラム</Link></li>
                <li><Link href="/watch">配信ガイド</Link></li>
                <li><Link href="/series">人気シリーズ</Link></li>
              </ul>
            </section>
          </div>
        </div>

        <div className="site-footer__lower">
          <div className="container site-footer__meta">
            <p>&copy; {mobileFooterYear} Stage Connect</p>
            <p>2.5次元舞台とキャストをつなぐデジタルアーカイブ</p>
          </div>
        </div>
      </footer>

      <FloatingCTA
        url="https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text"
        label="2.5次元舞台が見放題"
        subText="POPULAR"
        buttonText="DMMプレミアム"
        visible={showCTA}
      />
    </div>
  );
}
