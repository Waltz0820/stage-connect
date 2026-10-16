import type { Metadata } from 'next';
import Link from 'next/link';
import { OshiDiscoveryLinks } from '../../../components/OshiPoints';
export const metadata: Metadata = {
  title: '作品の探し方が新しくなります | Stage Connect',
  description: '作品の魅力をファンの投票で集める「推しポイント」へ移行しています。',
  robots: { index: false, follow: true },
  alternates: { canonical: (process.env.NEXT_PUBLIC_SITE_URL || 'https://stageconnect.jp') + '/tags' },
};
export default function LegacyTagsPage() {
  return <main className="container stack-lg" style={{ paddingBlock: 32 }}>
    <section className="hero-card stack-md"><h1 className="page-title">作品の探し方が新しくなります</h1>
      <p className="lead">運営によるタグ付けを終了し、ファンのみなさんが作品の魅力を選ぶ「推しポイント」へ移行しています。</p>
      <Link href="/plays" className="action-button">作品を探す →</Link>
    </section><OshiDiscoveryLinks locale="ja"/>
  </main>;
}
