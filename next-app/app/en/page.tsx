import type { Metadata } from "next";
import ArchiveHome from "../../components/ArchiveHome";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stage Connect | 2.5D Stage Play & Musical Archive",
  description:
    "Stage Connect is a digital archive for 2.5D stage plays and musicals. Browse productions, series, cast connections, and streaming availability from one place.",
  alternates: {
    canonical: `${siteUrl}/en`,
    languages: {
      ja: siteUrl,
      en: `${siteUrl}/en`,
    },
  },
};

export default function EnglishHomePage() {
  return <ArchiveHome locale="en"/>;
}
