import type { Metadata, Viewport } from "next";
import SiteChrome from "../components/SiteChrome";
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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
