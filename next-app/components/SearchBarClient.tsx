"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { getEnglishActorName, getEnglishPlayTitle, getEnglishSeriesName } from '../lib/en-copy';
import { normalizeSearchQuery, SEARCH_QUERY_LIMIT } from '../lib/search-query';
import type { SearchResultBundle } from '../lib/stage-connect';

const emptyResults: SearchResultBundle = { actors: [], plays: [], series: [] };

export function SearchBarClient() {
  const router = useRouter();
  const pathname = usePathname();
  const en = pathname === '/en' || pathname?.startsWith('/en/');
  const prefix = en ? '/en' : '';
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [results, setResults] = useState<SearchResultBundle>(emptyResults);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    setQuery(''); setResults(emptyResults); setIsOpen(false); setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onOutside = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false); setIsMobileOpen(false);
      }
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, []);

  useEffect(() => { if (isMobileOpen) inputRef.current?.focus(); }, [isMobileOpen]);

  useEffect(() => {
    const q = normalizeSearchQuery(query);
    setResults(emptyResults);
    if (!q) { setStatus('idle'); return; }
    setStatus('loading');
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Search unavailable');
        const data = await response.json() as { results: SearchResultBundle };
        if (active) { setResults(data.results); setStatus('ready'); }
      } catch {
        if (active) setStatus('error');
      }
    }, 180);
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  const close = () => { setIsOpen(false); setIsMobileOpen(false); };
  const submit = () => {
    const q = normalizeSearchQuery(query);
    if (!q) return;
    router.push(`${prefix}/search?q=${encodeURIComponent(q)}`);
    close();
  };
  const groups = [
    { label: en ? 'Actors' : '俳優', rows: results.actors.map(item => ({ id: item.id, href: `${prefix}/actors/${item.slug}`, title: en ? getEnglishActorName(item) : item.name, sub: en ? null : item.kana })) },
    { label: en ? 'Plays' : '作品', rows: results.plays.map(item => ({ id: item.id, href: `${prefix}/plays/${item.slug}`, title: en ? getEnglishPlayTitle(item) : item.title, sub: en ? item.franchiseNameEn : item.franchiseName })) },
    { label: en ? 'Series' : 'シリーズ', rows: results.series.map(item => ({ id: item.id, href: `${prefix}/series/${item.slug}`, title: en ? getEnglishSeriesName(item) : item.name, sub: null })) },
  ];
  const hasResults = groups.some(group => group.rows.length > 0);

  return <div className="search-shell" ref={rootRef} onKeyDown={event => {
    if (event.key === 'Escape') { close(); toggleRef.current?.focus(); }
  }}>
    <button ref={toggleRef} type="button" className="search-toggle" onClick={() => setIsMobileOpen(value => !value)}
      aria-label={en ? 'Open search' : '検索を開く'} aria-expanded={isMobileOpen} aria-controls={panelId}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
    </button>
    <div id={panelId} className={`search-panel ${isMobileOpen ? 'is-open' : ''}`} inert={!isMobileOpen}>
      <form role="search" className="search-input-wrap" onSubmit={event => { event.preventDefault(); submit(); }}>
        <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input ref={inputRef} value={query} maxLength={SEARCH_QUERY_LIMIT} onChange={event => { setQuery(event.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)} onKeyDown={event => {
            if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) event.preventDefault();
            if (event.key === 'ArrowDown' && !event.nativeEvent.isComposing) { event.preventDefault(); rootRef.current?.querySelector<HTMLAnchorElement>('.search-item')?.focus(); }
          }} placeholder={en ? 'Search actors, plays and series' : '俳優・作品・シリーズを検索'}
          aria-label={en ? 'Search actors, plays and series' : '俳優・作品・シリーズを検索'} className="search-input"/>
      </form>
      {isOpen && normalizeSearchQuery(query) ? <div className="search-dropdown">
        <div className="search-status" role="status">{status === 'loading' ? (en ? 'Searching…' : '検索中…')
          : status === 'error' ? (en ? 'Search is temporarily unavailable. Please try again.' : '検索を読み込めませんでした。時間をおいてお試しください。')
          : !hasResults ? (en ? 'No results found. Try another keyword.' : '見つかりませんでした。別のキーワードでお試しください。') : ''}</div>
        {groups.filter(group => group.rows.length).map(group => <div className="search-group" key={group.label}>
          <div className="search-group-title">{group.label}</div>
          {group.rows.map(item => <Link key={item.id} href={item.href} className="search-item" onClick={close}>
            <span><strong>{item.title}</strong>{item.sub ? <span className="search-item-sub">{item.sub}</span> : null}</span><span className="search-item-arrow" aria-hidden="true">→</span>
          </Link>)}
        </div>)}
        <button type="button" className="search-submit" onClick={submit}>{en ? 'View all results' : 'すべての検索結果を見る'}</button>
      </div> : null}
    </div>
  </div>;
}
