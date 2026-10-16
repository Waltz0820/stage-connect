import type { Metadata } from "next";
import { SiteSearchPage } from "../../../components/SiteSearchPage";

type SearchParams = {
  q?: string | string[];
};

export const metadata: Metadata = {
  title: "検索 | Stage Connect（ステコネ）",
  description: "俳優、作品、シリーズを横断して検索できます。",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const value = (await searchParams)?.q;
  return <SiteSearchPage locale="ja" query={Array.isArray(value) ? value[0] : value ?? ""}/>;
}
