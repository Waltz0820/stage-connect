import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTagDetailBySlug } from '../../../../lib/stage-connect';
type Params = { slug: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const tag = await getTagDetailBySlug((await params).slug);
  return { title: '作品リンクのアーカイブ | Stage Connect', robots: { index: false, follow: true },
    alternates: tag ? { canonical: (process.env.NEXT_PUBLIC_SITE_URL || 'https://stageconnect.jp') + '/tags/' + encodeURIComponent(tag.slug) } : undefined };
}
// Keep relevant destinations for incoming links pending the full backlink review.
export default async function LegacyTagArchive({ params }: { params: Promise<Params> }) {
  const archive = await getTagDetailBySlug((await params).slug);
  if (!archive) notFound();
  return <main className="container stack-lg" style={{ paddingBlock: 32 }}>
    <section className="hero-card stack-md"><h1 className="page-title">作品リンクのアーカイブ</h1>
      <p className="lead">この分類は更新を終了しました。以前このページで紹介していた作品は、以下から引き続き確認できます。</p>
      <Link href="/plays" className="action-button">新しい作品一覧を見る →</Link>
    </section>
    <section className="section-card stack-md"><h2 className="section-title">以前掲載していた作品</h2>
      <div className="legacy-work-links">{archive.plays.map((play) => <Link key={play.id} href={'/plays/' + play.slug}>
        <span>{play.title}</span><span aria-hidden="true">›</span>
      </Link>)}</div>
      {!archive.plays.length ? <p className="muted">このページの作品リンクはありません。作品一覧からお探しください。</p> : null}
    </section>
  </main>;
}
