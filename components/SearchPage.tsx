// src/components/SearchPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Breadcrumbs from './Breadcrumbs';
import SeoHead from './SeoHead';

type ActorRow = {
  id: string;
  slug: string;
  name: string;
  kana?: string | null;
};

type PlayRow = {
  id: string;
  slug: string;
  title: string;
  franchise?: string | null; // 表示用（joinで埋める）
};

type FranchiseRow = {
  id: string;
  name: string;
  slug?: string | null;
};

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 200;

// Supabase の or(...) 用に最低限安全にする（カンマは区切りとして致命的なので潰す）
const sanitizeForOr = (s: string) => s.replace(/,/g, ' ').trim();
const escapeLike = (s: string) => s.replace(/[%_]/g, '\\$&'); // % _ をエスケープ（念のため）

const SearchPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const qParam = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return (sp.get('q') || '').trim();
  }, [location.search]);

  const [input, setInput] = useState(qParam);

  // results
  const [actors, setActors] = useState<ActorRow[]>([]);
  const [plays, setPlays] = useState<PlayRow[]>([]);
  const [series, setSeries] = useState<FranchiseRow[]>([]);

  // counts（推定でも十分）
  const [actorsCount, setActorsCount] = useState<number | null>(null);
  const [playsCount, setPlaysCount] = useState<number | null>(null);
  const [seriesCount, setSeriesCount] = useState<number | null>(null);

  // paging
  const [actorsPage, setActorsPage] = useState(0);
  const [playsPage, setPlaysPage] = useState(0);
  const [seriesPage, setSeriesPage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState<{ actors: boolean; plays: boolean; series: boolean }>(
    { actors: false, plays: false, series: false }
  );

  const query = qParam;

  // 入力欄はURLと同期
  useEffect(() => {
    setInput(qParam);
  }, [qParam]);

  // SearchPage表示用：plays を join して franchise 名を埋める
  const normalizePlays = (rows: any[]): PlayRow[] => {
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      franchise: r.franchises?.name ?? null,
    }));
  };

  // 検索実行（debounce + 競合防止）
  const seqRef = useRef(0);
  useEffect(() => {
    const q = query;
    const mySeq = ++seqRef.current;

    if (!q) {
      setActors([]);
      setPlays([]);
      setSeries([]);
      setActorsCount(null);
      setPlaysCount(null);
      setSeriesCount(null);
      setActorsPage(0);
      setPlaysPage(0);
      setSeriesPage(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const t = window.setTimeout(async () => {
      try {
        const termForOr = escapeLike(sanitizeForOr(q));
        const like = `%${termForOr}%`;

        const [aRes, pRes, sRes] = await Promise.all([
          // actors（name / kana）
          supabase
            .from('actors')
            .select('id, slug, name, kana', { count: 'estimated' })
            .or(`name.ilike.${like},kana.ilike.${like}`)
            .order('name', { ascending: true })
            .range(0, PAGE_SIZE - 1),

          // plays（titleのみ検索 + franchises(name) joinで表示）
          // ※plays.franchise みたいな文字カラムが無い/使ってない前提
          supabase
            .from('plays')
            .select('id, slug, title, franchises(name)', { count: 'estimated' })
            .ilike('title', like)
            .order('title', { ascending: true })
            .range(0, PAGE_SIZE - 1),

          // series（name / slug）
          supabase
            .from('franchises')
            .select('id, name, slug', { count: 'estimated' })
            .or(`name.ilike.${like},slug.ilike.${like}`)
            .order('name', { ascending: true })
            .range(0, PAGE_SIZE - 1),
        ]);

        if (mySeq !== seqRef.current) return;

        if (aRes.error) console.warn('[search actors] error', aRes.error);
        if (pRes.error) console.warn('[search plays] error', pRes.error);
        if (sRes.error) console.warn('[search series] error', sRes.error);

        setActors((aRes.data as any) ?? []);
        setPlays(normalizePlays((pRes.data as any) ?? []));
        setSeries((sRes.data as any) ?? []);

        setActorsCount(typeof aRes.count === 'number' ? aRes.count : null);
        setPlaysCount(typeof pRes.count === 'number' ? pRes.count : null);
        setSeriesCount(typeof sRes.count === 'number' ? sRes.count : null);

        setActorsPage(0);
        setPlaysPage(0);
        setSeriesPage(0);
      } finally {
        if (mySeq === seqRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(t);
  }, [query]);

  const submit = () => {
    const q = input.trim();
    if (!q) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const canLoadMoreActors =
    actorsCount != null ? actors.length < actorsCount : actors.length === PAGE_SIZE * (actorsPage + 1);
  const canLoadMorePlays =
    playsCount != null ? plays.length < playsCount : plays.length === PAGE_SIZE * (playsPage + 1);
  const canLoadMoreSeries =
    seriesCount != null ? series.length < seriesCount : series.length === PAGE_SIZE * (seriesPage + 1);

  const loadMoreActors = async () => {
    if (!query || !canLoadMoreActors) return;

    setLoadingMore((s) => ({ ...s, actors: true }));
    try {
      const term = escapeLike(sanitizeForOr(query));
      const like = `%${term}%`;
      const nextPage = actorsPage + 1;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const res = await supabase
        .from('actors')
        .select('id, slug, name, kana')
        .or(`name.ilike.${like},kana.ilike.${like}`)
        .order('name', { ascending: true })
        .range(from, to);

      if (res.error) {
        console.warn('[load more actors] error', res.error);
        return;
      }

      setActors((prev) => [...prev, ...(((res.data as any) ?? []) as ActorRow[])]);
      setActorsPage(nextPage);
    } finally {
      setLoadingMore((s) => ({ ...s, actors: false }));
    }
  };

  const loadMorePlays = async () => {
    if (!query || !canLoadMorePlays) return;

    setLoadingMore((s) => ({ ...s, plays: true }));
    try {
      const term = escapeLike(sanitizeForOr(query));
      const like = `%${term}%`;
      const nextPage = playsPage + 1;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const res = await supabase
        .from('plays')
        .select('id, slug, title, franchises(name)')
        .ilike('title', like)
        .order('title', { ascending: true })
        .range(from, to);

      if (res.error) {
        console.warn('[load more plays] error', res.error);
        return;
      }

      setPlays((prev) => [...prev, ...normalizePlays((res.data as any) ?? [])]);
      setPlaysPage(nextPage);
    } finally {
      setLoadingMore((s) => ({ ...s, plays: false }));
    }
  };

  const loadMoreSeries = async () => {
    if (!query || !canLoadMoreSeries) return;

    setLoadingMore((s) => ({ ...s, series: true }));
    try {
      const term = escapeLike(sanitizeForOr(query));
      const like = `%${term}%`;
      const nextPage = seriesPage + 1;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const res = await supabase
        .from('franchises')
        .select('id, name, slug')
        .or(`name.ilike.${like},slug.ilike.${like}`)
        .order('name', { ascending: true })
        .range(from, to);

      if (res.error) {
        console.warn('[load more series] error', res.error);
        return;
      }

      setSeries((prev) => [...prev, ...(((res.data as any) ?? []) as FranchiseRow[])]);
      setSeriesPage(nextPage);
    } finally {
      setLoadingMore((s) => ({ ...s, series: false }));
    }
  };

  const totalShown = actors.length + plays.length + series.length;
  const totalEstimated =
    (actorsCount ?? actors.length) + (playsCount ?? plays.length) + (seriesCount ?? series.length);

  return (
    <div className="container mx-auto px-6 pt-8 pb-16 lg:px-8 max-w-5xl animate-fade-in-up">
      <SeoHead title="検索 | Stage Connect" robots="noindex,follow" />
      <Breadcrumbs items={[{ label: '検索', to: '/search' }]} />

      <div className="mb-8 text-center">
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-bold tracking-widest uppercase">
          SEARCH
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">検索結果</h1>
        <p className="text-slate-400 text-sm">キャスト・作品・シリーズをまとめて探せます</p>
      </div>

      {/* Search Box */}
      <div className="mb-10">
        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-500 group-focus-within:text-neon-purple transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="例：鈴木拡樹 / 刀剣 / MANKAI / テニミュ"
            className="block w-full pl-11 pr-28 py-3 border border-white/10 rounded-full leading-5 bg-black/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-theater-surface focus:ring-1 focus:ring-neon-purple focus:border-neon-purple/50 sm:text-sm transition-all shadow-[0_0_10px_rgba(0,0,0,0.2)] backdrop-blur-sm"
          />

          <button
            type="button"
            onClick={submit}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
          >
            検索
          </button>

          <div className="absolute inset-0 rounded-full ring-1 ring-neon-purple/0 group-focus-within:ring-neon-purple/30 group-focus-within:shadow-[0_0_15px_rgba(180,108,255,0.2)] pointer-events-none transition-all duration-300" />
        </div>

        {query && (
          <div className="mt-4 text-center text-xs text-slate-500">
            クエリ：<span className="text-slate-300 font-mono">{query}</span>
            {loading ? (
              <span className="ml-2 text-slate-400">検索中...</span>
            ) : (
              <span className="ml-2 text-slate-500">
                （表示 {totalShown} / 推定 {totalEstimated}）
              </span>
            )}
          </div>
        )}
      </div>

      {!query && (
        <div className="max-w-2xl mx-auto bg-theater-surface/50 border border-white/10 rounded-xl p-6 text-slate-300">
          <div className="text-sm text-slate-400">
            上の検索窓にキーワードを入れてください。<br />
            キャスト名 / 作品名 / シリーズ名（フランチャイズ）で探せます。
          </div>
        </div>
      )}

      {query && !loading && totalShown === 0 && (
        <div className="max-w-2xl mx-auto bg-theater-surface/50 border border-white/10 rounded-xl p-6 text-center text-slate-400">
          該当する結果が見つかりませんでした
        </div>
      )}

      {query && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Series */}
          <div className="bg-theater-surface/30 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">シリーズ</div>
              <div className="text-[10px] text-slate-500">
                {seriesCount != null ? `${series.length}/${seriesCount}` : series.length}
              </div>
            </div>

            <ul className="divide-y divide-white/5">
              {series.map((s) => {
                const key = (s.slug && s.slug.trim()) ? s.slug.trim() : s.name;
                return (
                  <li key={s.id}>
                    <Link
                      to={`/series/${encodeURIComponent(key)}`}
                      className="block px-4 py-3 hover:bg-neon-cyan/10 transition-colors"
                    >
                      <div className="text-sm font-semibold text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">/series/{key}</div>
                    </Link>
                  </li>
                );
              })}
              {series.length === 0 && <li className="px-4 py-6 text-sm text-slate-500 italic">該当なし</li>}
            </ul>

            {canLoadMoreSeries && (
              <div className="p-3 border-t border-white/5 bg-black/20">
                <button
                  onClick={loadMoreSeries}
                  disabled={loadingMore.series}
                  className="w-full px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  {loadingMore.series ? '読み込み中...' : 'もっと見る'}
                </button>
              </div>
            )}
          </div>

          {/* Actors */}
          <div className="bg-theater-surface/30 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">キャスト</div>
              <div className="text-[10px] text-slate-500">
                {actorsCount != null ? `${actors.length}/${actorsCount}` : actors.length}
              </div>
            </div>

            <ul className="divide-y divide-white/5">
              {actors.map((a) => (
                <li key={a.id}>
                  <Link to={`/actors/${a.slug}`} className="block px-4 py-3 hover:bg-neon-purple/10 transition-colors">
                    <div className="text-sm font-semibold text-white">{a.name}</div>
                    {a.kana && <div className="text-[10px] text-slate-500">{a.kana}</div>}
                  </Link>
                </li>
              ))}
              {actors.length === 0 && <li className="px-4 py-6 text-sm text-slate-500 italic">該当なし</li>}
            </ul>

            {canLoadMoreActors && (
              <div className="p-3 border-t border-white/5 bg-black/20">
                <button
                  onClick={loadMoreActors}
                  disabled={loadingMore.actors}
                  className="w-full px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  {loadingMore.actors ? '読み込み中...' : 'もっと見る'}
                </button>
              </div>
            )}
          </div>

          {/* Plays */}
          <div className="bg-theater-surface/30 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">作品</div>
              <div className="text-[10px] text-slate-500">
                {playsCount != null ? `${plays.length}/${playsCount}` : plays.length}
              </div>
            </div>

            <ul className="divide-y divide-white/5">
              {plays.map((p) => (
                <li key={p.id}>
                  <Link to={`/plays/${p.slug}`} className="block px-4 py-3 hover:bg-neon-pink/10 transition-colors">
                    <div className="text-sm font-semibold text-white">{p.title}</div>
                    {p.franchise && <div className="text-[10px] text-slate-500">{p.franchise}</div>}
                  </Link>
                </li>
              ))}
              {plays.length === 0 && <li className="px-4 py-6 text-sm text-slate-500 italic">該当なし</li>}
            </ul>

            {canLoadMorePlays && (
              <div className="p-3 border-t border-white/5 bg-black/20">
                <button
                  onClick={loadMorePlays}
                  disabled={loadingMore.plays}
                  className="w-full px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  {loadingMore.plays ? '読み込み中...' : 'もっと見る'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
