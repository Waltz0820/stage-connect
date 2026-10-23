export function DirectoryHero({ kind, title }: {
  kind: "actors" | "plays" | "series"; title: string;
}) {
  return <section className={`hero-card works-index-hero directory-hero directory-hero--${kind}`}>
    <span className="directory-hero__word" aria-hidden="true">{kind.toUpperCase()}</span>
    <div className="directory-hero__heading"><h1 className="page-title">{title}</h1></div>
  </section>;
}
