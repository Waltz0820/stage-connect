import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AnalyticsTracker } from "../components/AnalyticsTracker";
import SiteChrome from "../components/SiteChrome";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-KLT69885CC";
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const adsenseClient = "ca-pub-3321869445789640";

export const metadata: Metadata = {
  title: "Stage Connect",
  description:
    "Stage Connect（ステコネ）は、2.5次元舞台・ミュージカルの作品、キャスト、シリーズ、公演情報を整理して読めるデジタルアーカイブです。",
  metadataBase: new URL(siteUrl),
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
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
        <script
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
        />
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${gaId}', { send_page_view: false });
          `}
        </Script>
      </head>
      <body>
        <Suspense fallback={null}>
          <AnalyticsTracker measurementId={gaId} />
        </Suspense>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
