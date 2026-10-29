export function DirectoryLoading({ kind, locale }: {
  kind: 'actors' | 'plays' | 'series'; locale: 'ja' | 'en';
}) {
  return (
    <div className={`directory-loading directory-loading--${kind}`} aria-busy="true">
      <span role="status" className="sr-only">{locale === 'ja' ? '一覧を読み込んでいます' : 'Loading directory'}</span>
      <div aria-hidden="true">
        <div className="directory-loading__hero"><span>{kind.toUpperCase()}</span></div>
        <div className="directory-loading__body">
          <div className="directory-loading__search" />
          {Array.from({ length: 5 }, (_, index) => <div key={index} className="directory-loading__row"><i /><div><b /><b /></div></div>)}
        </div>
      </div>
    </div>
  );
}
