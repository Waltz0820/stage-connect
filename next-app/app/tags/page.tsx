import type { Metadata } from "next";
import Link from "next/link";
import { StructuredData } from "../../components/StructuredData";
import { buildCollectionPageStructuredData } from "../../lib/structured-data";
import { getTagList } from "../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const metadata: Metadata = {
  title: "タグで探す | Stage Connect（ステコネ）",
  description:
    "Stage Connect（ステコネ）で、2.5次元舞台・ミュージカル作品を世界観・観劇体験・原作ジャンルのタグから探せます。",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${siteUrl}/tags`,
  },
};

const sectionMeta = [
  {
    key: "world",
    title: "世界観・ジャンル",
    lead: "作品の空気感や世界設定から探したい時のタグです。",
  },
  {
    key: "experience",
    title: "観劇体験タグ",
    lead: "初見向き、泣ける、ライブ感など体験ベースで探せます。",
  },
  {
    key: "origin",
    title: "原作・出典ジャンル",
    lead: "漫画、ゲーム、アニメなど原作の入口から探せます。",
  },
] as const;

export default async function TagsPage() {
  const tags = await getTagList();
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "タグで探す",
    description:
      "2.5次元舞台・ミュージカル作品を、世界観・体験・原作ジャンルのタグから探せるページです。",
    path: "/tags",
  });

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Tags</span>
            <h1 className="page-title">タグで探す</h1>
            <p className="lead">
              作品名や俳優名ではなく、世界観・観劇体験・原作ジャンルといった切り口から、2.5次元舞台・ミュージカルを探せます。
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">登録タグ {tags.length}件</span>
            <span className="catalog-chip">カテゴリ {sectionMeta.length}系統</span>
            <span className="catalog-chip">タグ詳細から作品へ移動</span>
          </div>
        </section>

        <section className="section-card stack-lg">
          {sectionMeta.map((section) => {
            const list = tags.filter((item) => item.type === section.key);
            if (list.length === 0) return null;

            return (
              <section key={section.key} className="tag-section stack-md">
                <div className="section-header-inline">
                  <div className="stack-sm">
                    <h2 className="section-title">{section.title}</h2>
                    <p className="catalog-note">{section.lead}</p>
                  </div>
                  <span className="pill">{list.length}件</span>
                </div>

                <div className="tag-explorer-grid">
                  {list.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${encodeURIComponent(tag.slug)}`}
                      className="tag-link-card"
                    >
                      <div className="tag-link-card__top">
                        <strong className="tag-link-card__name">{tag.name}</strong>
                        <span className="tag-link-card__count">{tag.playsCount}作品</span>
                      </div>
                      {tag.description ? (
                        <div className="tag-link-card__text">{tag.description}</div>
                      ) : (
                        <div className="tag-link-card__text">このタグに関連する作品一覧へ進みます。</div>
                      )}
                      <div className="catalog-card__footer">
                        <span className="catalog-link">タグ詳細を見る</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </section>
      </div>
    </main>
  );
}
