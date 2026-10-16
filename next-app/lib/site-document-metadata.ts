import type { Metadata, Viewport } from "next";
import type { SiteLocale } from "./locale-routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
const verification = process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
export const siteViewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export const getSiteMetadata = (locale: SiteLocale): Metadata => ({
  title: "Stage Connect",
  description: locale === "en"
    ? "Stage Connect is a digital archive connecting 2.5D stage productions, actors, cast history, and streaming information."
    : "Stage Connect（ステコネ）は、2.5次元舞台・ミュージカルの作品、キャスト、シリーズ、配信情報を横断して確認できるデジタルアーカイブです。",
  metadataBase: new URL(siteUrl),
  verification: verification ? { google: verification } : undefined,
});
