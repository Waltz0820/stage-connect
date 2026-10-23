import type { Metadata, Viewport } from "next";
import SiteDocument from "../../components/SiteDocument";
import { getSiteMetadata, siteViewport } from "../../lib/site-document-metadata";
import "../globals.css";
import "../stage-v2.css";
import "../editorial-v2.css";
import "../editorial-details.css";
import "../editorial-directory.css";
import "../editorial-support.css";
import "../editorial-about.css";
import "../editorial-interactions.css";
import "../editorial-copy.css";

export const metadata: Metadata = getSiteMetadata("en");
export const viewport: Viewport = siteViewport;
export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument locale="en">{children}</SiteDocument>;
}
