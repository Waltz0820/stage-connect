export function DirectoryHero({ kind, title, description, count, unit }: {
  kind: "actors" | "plays" | "series"; title: string; description: string; count: number; unit: string;
}) {
  return <section className={`hero-card works-index-hero directory-hero directory-hero--${kind}`}>
    <span className="directory-hero__word" aria-hidden="true">{kind.toUpperCase()}</span>
    <div className="directory-hero__heading"><h1 className="page-title">{title}</h1><p className="directory-hero__count"><strong>{count.toLocaleString()}</strong><span>{unit}</span></p></div>
    <p className="lead">{description}</p>
  </section>;
}
