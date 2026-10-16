type ArchiveIconName = 'actor' | 'play' | 'series' | 'swords' | 'tennis' | 'music' | 'theatre';

const paths: Record<ArchiveIconName, React.ReactNode> = {
  actor: <><circle cx="12" cy="7" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></>,
  play: <><path d="M3 4h18v16H3zM7 4v16M17 4v16M7 5l5 4 5-4M7 19l4-7M17 19l-4-7"/></>,
  series: <><path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/></>,
  swords: <><path d="m4 3 13 13 3-3L7 2 4 3ZM20 3 7 16l-3-3L17 2l3 1ZM13 16l7 6M11 16l-7 6M13 20l7-7M4 13l7 7"/></>,
  tennis: <><ellipse cx="15" cy="8.5" rx="5" ry="6.5" transform="rotate(35 15 8.5)"/><path d="m10 13-7 8M8 15l2 2M12 5l6 4M11 8l6 4M14 3l-3 9M17 4l-4 10"/></>,
  music: <><path d="M9 18V5l12-3v13M9 9l12-3"/><ellipse cx="5.5" cy="18" rx="3.5" ry="3"/><ellipse cx="17.5" cy="15" rx="3.5" ry="3"/></>,
  theatre: <><path d="m2 5 10 2-1 8c-1 4-8 4-9-1V5ZM13 3l9 2v8c-1 4-6 5-9 1M4 9h1M8 10h1M4 13c1 2 3 2 4 1M16 7h1M19 8h1M16 12c1-2 3-2 4-1"/></>,
};

export function ArchiveIcon({ name }: { name: ArchiveIconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

// A few explicit motifs for identified series families; other series use their recorded format.
// These are decorative symbols, not official artwork, logos, or user-voted tags.
export function SeriesMotif({ slug, format }: { slug: string; format: string | null }) {
  const name: ArchiveIconName = slug.startsWith('touken-ranbu') || slug === 'butai-touken-ranbu'
    ? 'swords'
    : slug.startsWith('tennimu') ? 'tennis'
    : format === 'musical' ? 'music'
    : format === 'stage' ? 'theatre' : 'series';
  return <ArchiveIcon name={name}/>;
}
