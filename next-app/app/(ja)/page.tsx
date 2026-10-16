import type { Metadata } from "next";
import ArchiveHome from "../../components/ArchiveHome";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stage Connect（ステコネ） | 2.5次元舞台・ミュージカルのキャスト・作品アーカイブ",
  description:
    "Stage Connect（ステコネ）は、2.5次元舞台・ミュージカルの作品とキャストをつなぐデジタルアーカイブです。出演者・配信（VOD）・公演情報・シリーズ情報をまとめて確認できます。",
  alternates: {
    canonical: siteUrl,
    languages: {
      ja: siteUrl,
      en: `${siteUrl}/en`,
    },
  },
};

export default function HomePage() {
  return <ArchiveHome locale="ja"/>;
}
