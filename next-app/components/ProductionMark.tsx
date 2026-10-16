import { SeriesMotif } from './ArchiveIcon';

/** Decorative archive marker. Titles and facts remain in the adjacent, accessible content. */
export function ProductionMark({ kind = 'play', seriesSlug = '', format = null }: {
  kind?: 'play' | 'series';
  seriesSlug?: string | null;
  format?: string | null;
}) {
  return <span className={`production-mark production-mark--${kind}`} aria-hidden="true">
    <SeriesMotif slug={seriesSlug ?? ''} format={format} fallback={kind}/>
  </span>;
}
