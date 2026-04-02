import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const metadata: Metadata = {
  title: "Stage Connect",
  description:
    "Stage Connect の公開ページを SSR / SSG 化し、主要内部リンクを初期HTMLで出力するための Next.js プロトタイプです。",
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className="page-shell">
          <header className="site-header">
            <div className="container site-header__inner">
              <Link href="/" className="site-brand">
                STAGE <span>CONNECT</span>
              </Link>
              <nav className="site-nav">
                <Link href="/plays">作品一覧</Link>
                <Link href="/actors">俳優一覧</Link>
                <Link href="/series">シリーズ一覧</Link>
                <Link href="/guide">編集部ガイド</Link>
                <Link href="/watch">視聴ガイド</Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
