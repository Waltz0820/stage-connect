import type { Metadata } from "next";
import { FavoritesClient } from "../../../components/FavoritesClient";

export const metadata: Metadata = {
  title: "お気に入り | Stage Connect（ステコネ）",
  description: "保存した俳優・作品を一覧できるお気に入りページです。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FavoritesPage() {
  return (
    <main className="container editorial-support support-favorites">
      <FavoritesClient />
    </main>
  );
}
