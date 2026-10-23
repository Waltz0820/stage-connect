"use client";

import { useEffect, useId, useState } from 'react';
import { OSHI_POINTS, OSHI_MIN_PARTICIPANTS } from '../lib/oshi-points.mjs';
import { OshiIcon } from './OshiPoints';

type Results = { participants: number; top: { id: string; votes: number; support: number }[] };
const copy = {
  ja: { title: 'この作品の推しポイントは？', intro: '好きなところを選んで教えてね！', limit: '1〜3項目まで選べます。ログイン不要。',
    send: '推しポイントを送る', update: '選び直して更新する', sending: '送信中…', saved: 'ありがとう！ あとから選び直せます。',
    results: 'みんなの推しポイント', early: 'まだ少人数の声です。あなたの推しポイントも教えてね。',
    first: 'この作品の推しポイントを最初に教えてね。', note: '支持率＝その項目を選んだ人数 ÷ 投票参加人数（複数選択）',
    unavailable: '投票はただいま準備中です。時間をおいて、また遊びにきてね。', failed: '送信できませんでした。通信を確認して、もう一度お試しください。',
    rate: '短い間に投票が続いたため、少し時間をおいてからお試しください。', cookie: '投票の確認に必要なCookieを保存できませんでした。Cookieを有効にして再読み込みしてください。',
    loading: '投票を読み込み中…', max: '選べるのは3項目までです。', privacy: '同じブラウザでの投票を記憶します。', privacyLink: 'プライバシーについて', },
  en: { title: 'What do you love about this production?', intro: 'Choose your favorite things!', limit: 'Choose 1–3 points. No login needed.',
    send: 'Share what you love', update: 'Update my choices', sending: 'Sending…', saved: 'Thank you! You can change your choices anytime.',
    results: 'What fans love', early: 'Only a few fans have voted so far. Add your voice!',
    first: 'Be the first to share what you love about this production.', note: 'Support = voters who chose the point ÷ all participants (multiple choices allowed).',
    unavailable: 'Voting is being prepared. Please come back a little later.', failed: 'Your vote could not be sent. Check your connection and try again.',
    rate: 'There have been too many votes in a short time. Please try again later.', cookie: 'A voting cookie could not be saved. Please enable cookies and reload.',
    loading: 'Loading votes…', max: 'You can choose up to 3 points.', privacy: 'Your vote is remembered in this browser.', privacyLink: 'Privacy details', },
};
export default function OshiVotingClient({ playId, locale }: { playId: string; locale: 'ja' | 'en' }) {
  const t = copy[locale];
  const headingId = useId();
  const helpId = useId();
  const [selection, setSelection] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'sending' | 'unavailable'>('loading');
  const [message, setMessage] = useState('');
  const endpoint = `/api/plays/${playId}/oshi`;
  useEffect(() => {
    const abort = new AbortController();
    setState('loading'); setMessage(''); setSelection([]); setSaved([]); setResults(null);
    fetch(endpoint, { cache: 'no-store', signal: abort.signal }).then(async (response) => {
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      setSelection(data.selection); setSaved(data.selection); setResults(data); setState('ready');
    }).catch(() => { if (!abort.signal.aborted) setState('unavailable'); });
    return () => abort.abort();
  }, [endpoint]);
  const changed = [...selection].sort().join(',') !== [...saved].sort().join(',');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (state !== 'ready' || !selection.length || !changed) return;
    setState('sending'); setMessage('');
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ points: selection }) });
      const data = await response.json();
      if (!response.ok) {
        setMessage(response.status === 429 ? t.rate : data.error === 'identity_required' ? t.cookie : response.status === 503 ? t.unavailable : t.failed);
      } else {
        setSaved(data.selection);
        setResults(data.results ?? null);
        setMessage(t.saved);
      }
    } catch { setMessage(t.failed); }
    finally { setState('ready'); }
  }
  return <section id="fan-points" className="oshi-section" aria-labelledby={headingId}>
    <form onSubmit={submit} className="oshi-vote">
      <h2 id={headingId}>{t.title}</h2><p className="oshi-intro">{t.intro}</p>
      <p id={helpId} className="oshi-help">{t.limit}</p>
      <fieldset disabled={state !== 'ready'} aria-describedby={helpId}>
        <legend className="sr-only">{t.title}</legend>
        <div className="oshi-choices">{OSHI_POINTS.map((point) => {
          const selected = selection.includes(point.id);
          return <button type="button" key={point.id} aria-pressed={selected} className={`oshi-choice ${selected ? 'is-selected' : ''}`}
            onClick={() => {
              if (!selected && selection.length >= 3) { setMessage(t.max); return; }
              setSelection((current) => selected ? current.filter((id) => id !== point.id) : [...current, point.id]); setMessage('');
            }}>
            <OshiIcon icon={point.icon}/><span>{point[locale]}</span><span className="oshi-choice__mark" aria-hidden="true">{selected ? '✓' : '+'}</span>
          </button>;
        })}</div>
      </fieldset>
      <div className="oshi-submit-row"><span>{selection.length} / 3</span><button type="submit" className="oshi-submit" disabled={state !== 'ready' || !selection.length || !changed}>
        {state === 'sending' ? t.sending : saved.length ? t.update : t.send}<span aria-hidden="true">→</span>
      </button></div>
      <p role="status" aria-live="polite" className="oshi-status">{state === 'loading' ? t.loading : state === 'unavailable' ? t.unavailable : message}</p>
      <p className="oshi-privacy">{t.privacy} <a href="/privacy">{t.privacyLink}</a></p>
    </form>
    {results && results.participants > 0 ? <div className="oshi-results">
      <div className="oshi-results__heading"><h2>{t.results}</h2><p>{locale === 'ja' ? `${results.participants.toLocaleString()}人が参加` : `${results.participants.toLocaleString()} ${results.participants === 1 ? 'participant' : 'participants'}`}</p></div>
      {results.participants < OSHI_MIN_PARTICIPANTS ? <p className="oshi-early">{t.early}</p> : null}
      <ol>{results.top.map((row) => {
        const point = OSHI_POINTS.find((item) => item.id === row.id)!;
        return <li key={row.id}><OshiIcon icon={point.icon}/><span>{point[locale]}</span><strong>{row.support}<small>%</small></strong>
          <span className="oshi-bar" aria-hidden="true"><span style={{ width: `${row.support}%` }}/></span></li>;
      })}</ol><p className="oshi-help">{t.note}</p>
    </div> : state === 'ready' && results ? <p className="oshi-first">{t.first}</p> : null}
  </section>;
}
