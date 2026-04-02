import type { Metadata, Viewport } from "next";
import SiteChrome from "../components/SiteChrome";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const metadata: Metadata = {
  title: "Stage Connect",
  description:
    "Stage Connect（ステコネ）は、2.5次元舞台・ミュージカルの作品、キャスト、シリーズ、公演情報を整理して読めるデジタルアーカイブです。",
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
