import Link from 'next/link';
import { OSHI_POINTS } from '../lib/oshi-points.mjs';

const paths: Record<string, React.ReactNode> = {
  person: <><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3Z"/></>,
  music: <><path d="M9 18V5l12-3v13M9 9l12-3"/><ellipse cx="5.5" cy="18" rx="3.5" ry="3"/><ellipse cx="17.5" cy="15" rx="3.5" ry="3"/></>,
  dance: <><circle cx="12" cy="4" r="2"/><path d="m3 5 6 5h6l6-5M12 10v5m0 0-6 7m6-7 6 7"/></>,
  swords: <><path d="m4 2 16 16m0-16L4 18M2 15l7 7m6-20L2 2l1 5M15 22l7-7M17 3l5-1-1 5"/></>,
  book: <><path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v16"/></>,
  curtain: <><path d="M2 3h20v18h-3V6H5v15H2Zm3 3 7 3 7-3M5 6l4 8-4 7m14-15-4 8 4 7"/></>,
  shirt: <path d="m8 3-6 4 3 5 3-2v12h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z"/>,
  star: <path d="m12 2 3 6.5 7 1-5 5 1 7-6-3.5L6 22l1-7-5-5 7-1Z"/>,
  smile: <><circle cx="12" cy="12" r="10"/><path d="M7 14c2 5 8 5 10 0M8 8h.01M16 8h.01"/></>,
  drop: <path d="M12 2S4 12 4 16a8 8 0 0 0 16 0c0-4-8-14-8-14ZM8 15c-1 3 1 4 2 4"/>,
};
export function OshiIcon({ icon }: { icon: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[icon] ?? paths.star}</svg>;
}
export function OshiDiscoveryLinks({ locale }: { locale: 'ja' | 'en' }) {
  return <section className="oshi-discovery">
    <h2>{locale === 'ja' ? 'みんなの推しポイントから探す' : 'Discover what fans love'}</h2>
    <p>{locale === 'ja' ? '歌や殺陣など好きな要素で作品を探す。' : 'Find productions through music, action and more.'}</p>
    <div className="oshi-discovery__grid">{OSHI_POINTS.map((point) => <Link key={point.id} href={`${locale === 'en' ? '/en' : ''}/plays?point=${point.id}&sort=support`}>
      <OshiIcon icon={point.icon}/><span>{point[locale]}</span><span aria-hidden="true">›</span>
    </Link>)}</div>
  </section>;
}
