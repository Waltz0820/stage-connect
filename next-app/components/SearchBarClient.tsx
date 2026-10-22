"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { getEnglishActorName, getEnglishPlayTitle, getEnglishSeriesName } from '../lib/en-copy';
import { normalizeSearchQuery, SEARCH_QUERY_LIMIT } from '../lib/search-query';
import type { SearchResultBundle } from '../lib/stage-connect';
import { cycleDialogFocus } from '../lib/dialog-focus';

const emptyResults: SearchResultBundle = { actors: [], plays: [], series: [] };
const searchIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path strokeLinecap="round" d="m16 16 5 5"/></svg>;

export function SearchBarClient({ variant = 'header' }: { variant?: 'header' | 'hero' }) {
  const router = useRouter();
  const pathname = usePathname();
  const en = pathname === '/en' || pathname?.startsWith('/en/');
  const prefix = en ? '/en' : '';
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const heroRef = useRef<HTMLAnchorElement>(null);
  const panelId = useId();
  const titleId = useId();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResultBundle>(emptyResults);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    setQuery(''); setResults(emptyResults); setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    inputRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const q = normalizeSearchQuery(query);
    setResults(emptyResults);
    if (!q) { setStatus('idle'); return; }
    setStatus('loading');
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/search?q=' + encodeURIComponent(q), { signal: controller.signal });
        if (!response.ok) throw new Error('Search unavailable');
        const data = await response.json() as { results: SearchResultBundle };
        if (active) { setResults(data.results); setStatus('ready'); }
      } catch {
        if (active) setStatus('error');
      }
    }, 180);
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  const close = () => {
    setIsOpen(false);
    // Native dialog also restores focus; keep the explicit opener for programmatic closes.
    (variant === 'hero' ? heroRef.current : toggleRef.current)?.focus();
  };
  const submit = () => {
    const q = normalizeSearchQuery(query);
    if (!q) return;
    router.push(prefix + '/search?q=' + encodeURIComponent(q));
    close();
  };
  const groups = [
    { kind: 'actors', label: en ? 'Actors' : '俳優', rows: results.actors.map(item => ({ id: item.id, href: prefix + '/actors/' + item.slug, title: en ? getEnglishActorName(item) : item.name, sub: en ? null : item.kana })) },
    { kind: 'plays', label: en ? 'Plays' : '作品', rows: results.plays.map(item => ({ id: item.id, href: prefix + '/plays/' + item.slug, title: en ? getEnglishPlayTitle(item) : item.title, sub: en ? item.franchiseNameEn : item.franchiseName })) },
    { kind: 'series', label: en ? 'Series' : 'シリーズ', rows: results.series.map(item => ({ id: item.id, href: prefix + '/series/' + item.slug, title: en ? getEnglishSeriesName(item) : item.name, sub: null })) },
  ];
  const hasResults = groups.some(group => group.rows.length > 0);
  const searchLabel = en ? 'Search actors, plays and series' : '俳優名・作品名・シリーズ名で検索';

  return <div className={variant === 'hero' ? 'archive-hero-search' : 'search-shell'}>
    {variant === 'hero' ? <a ref={heroRef} href={prefix + '/search'} className="archive-search-entry" onClick={event => { event.preventDefault(); setIsOpen(true); }} aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={panelId}>
      {searchIcon}<span>{searchLabel}</span><span className="archive-search-entry__arrow" aria-hidden="true">→</span>
    </a> : <><button ref={toggleRef} type="button" className="search-toggle" onClick={() => setIsOpen(true)}
      aria-label={en ? 'Open search' : '検索を開く'} aria-expanded={isOpen} aria-haspopup="dialog" aria-controls={panelId}>{searchIcon}</button><noscript><a href={prefix + '/search'}>{en ? 'Search' : '検索'}</a></noscript></>}

    <dialog ref={dialogRef} id={panelId} className="archive-search-dialog" aria-labelledby={titleId} onClose={() => setIsOpen(false)} onCancel={() => setIsOpen(false)} onClick={event => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
        if (event.key !== 'Tab') return;
        if (cycleDialogFocus(event.currentTarget, event.shiftKey)) event.preventDefault();
      }}>
      <div className="archive-search-dialog__inner">
        <div className="archive-search-dialog__header"><span>SEARCH</span><button type="button" onClick={close} aria-label={en ? 'Close search' : '検索を閉じる'}>×</button></div>
        <h2 id={titleId}>{en ? 'Find your next connection.' : '俳優・作品・シリーズを探す'}</h2>
        <form role="search" className="archive-search-form" onSubmit={event => { event.preventDefault(); submit(); }}>
          {searchIcon}
          <input ref={inputRef} type="search" value={query} maxLength={SEARCH_QUERY_LIMIT} onChange={event => setQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) event.preventDefault();
              if (event.key === 'ArrowDown' && !event.nativeEvent.isComposing) { event.preventDefault(); dialogRef.current?.querySelector<HTMLAnchorElement>('.search-item')?.focus(); }
            }} placeholder={en ? 'Actor, play or series name' : '俳優名・作品名・シリーズ名'} aria-label={searchLabel}/>
          <button type="submit" aria-label={en ? 'Search' : '検索する'}>→</button>
        </form>
        {!normalizeSearchQuery(query) ? <div className="archive-search-browse">{groups.map(group => <Link key={group.kind} href={prefix + '/' + group.kind} onClick={close}>{group.label}<span aria-hidden="true">→</span></Link>)}</div> : <div className="archive-search-results" aria-busy={status === 'loading'}>
          <div className="archive-search-status" role="status">{status === 'loading' ? (en ? 'Searching…' : '検索中…')
            : status === 'error' ? (en ? 'Search is temporarily unavailable. Please try again.' : '検索を読み込めませんでした。時間をおいてお試しください。')
            : status === 'ready' && !hasResults ? (en ? 'No results found. Try another keyword.' : '見つかりませんでした。別のキーワードでお試しください。') : ''}</div>
          {groups.filter(group => group.rows.length).map(group => <section className="archive-search-group" key={group.kind}>
            <h3>{group.label}</h3>
            {group.rows.map(item => <Link key={item.id} href={item.href} className="search-item" onClick={close}>
              <span><strong>{item.title}</strong>{item.sub ? <span className="search-item-sub">{item.sub}</span> : null}</span><span aria-hidden="true">→</span>
            </Link>)}
          </section>)}
          {status !== 'loading' ? <button type="button" className="archive-search-all" onClick={submit}>{en ? 'View all results' : 'すべての検索結果を見る'} <span aria-hidden="true">→</span></button> : null}
          {status === 'ready' && !hasResults ? <div className="archive-search-browse">{groups.map(group => <Link key={group.kind} href={prefix + '/' + group.kind} onClick={close}>{group.label}<span aria-hidden="true">→</span></Link>)}</div> : null}
        </div>}
      </div>
    </dialog>
  </div>;
}
