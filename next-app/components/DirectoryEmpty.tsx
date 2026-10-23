import Link from 'next/link';

export function DirectoryEmpty({ locale, kind }: { locale: 'ja' | 'en'; kind: 'actors' | 'plays' | 'series' }) {
  const en = locale === 'en';
  const names = { actors: '俳優', plays: '作品', series: 'シリーズ' };
  return <div className="directory-empty">
    <p>{en ? 'No matches for these filters.' : `条件に合う${names[kind]}が見つかりませんでした。`}</p>
    <Link href={`${en ? '/en' : ''}/${kind}`}>{en ? 'Clear filters' : '条件をクリア'}<span aria-hidden="true">→</span></Link>
  </div>;
}
