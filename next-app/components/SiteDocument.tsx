import { Suspense } from "react";
import Script from "next/script";
import { AnalyticsTracker } from "./AnalyticsTracker";
import SiteChrome from "./SiteChrome";
import type { SiteLocale } from "../lib/locale-routing";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-KLT69885CC";
const adsenseClient = "ca-pub-3321869445789640";

export default function SiteDocument({ locale, children }: { locale: SiteLocale; children: React.ReactNode }) {
  return (
    <html lang={locale}>
      <head>
        <script async crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`} />
        <Script id="ga4-init" strategy="beforeInteractive">{`
          if (['stageconnect.jp', 'www.stageconnect.jp'].includes(window.location.hostname) && !/^\\/admin(?:\\/|$)/.test(window.location.pathname)) {
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false, page_location: window.location.origin + window.location.pathname });
          var tag = document.createElement('script');
          tag.async = true;
          tag.src = 'https://www.googletagmanager.com/gtag/js?id=${gaId}';
          document.head.appendChild(tag);
          }
        `}</Script>
      </head>
      <body>
        <Suspense fallback={null}><AnalyticsTracker measurementId={gaId} /></Suspense>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
