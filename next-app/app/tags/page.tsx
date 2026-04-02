import type { Metadata } from "next";
import Link from "next/link";
import { getTagList } from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "タグ一覧 | Stage Connect",
  robots: {
    index: false,
    follow: true,
  },
};

const sectionMeta = [
  { key: "world", title: "世界観・ジャンル" },
  { key: "experience", title: "鑑賞体験タグ" },
  { key: "origin", title: "原作・出典軸" },
] as const;

export default async function TagsPage() {
  const tags = await getTagList();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-sm">
          <span className="eyebrow">TAGS</span>
          <h1 className="page-title">タグで探す</h1>
          <p className="muted">作品の世界観、鑑賞体験、原作軸から2.5次元舞台を横断して探せます。</p>
        </section>

        <section className="section-card stack-md">
          {sectionMeta.map((section) => {
            const list = tags.filter((item) => item.type === section.key);
            if (list.length === 0) return null;

            return (
              <div key={section.key} className="stack-sm">
                <div className="section-header-inline">
                  <h2 className="section-title">{section.title}</h2>
                  <span className="pill">{list.length}</span>
                </div>
                <div className="tag-cloud-grid">
                  {list.map((tag) => (
                    <Link key={tag.id} href={`/tags/${encodeURIComponent(tag.slug)}`} className="tag-cloud-link">
                      {tag.name}
                      <span>{tag.playsCount}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
