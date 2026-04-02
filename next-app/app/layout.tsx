import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const metadata: Metadata = {
  title: "Stage Connect",
  description:
    "2.5次元舞台・ミュージカルの作品、俳優、シリーズ、配信情報を横断できるデータベースメディアです。",
  metadataBase: new URL(siteUrl),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
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
