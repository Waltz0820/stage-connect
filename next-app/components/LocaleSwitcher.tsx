"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getLanguageTargets } from '../lib/locale-routing';

function LanguageLinks({ pathname, search = '', hash = '' }: { pathname: string | null; search?: string; hash?: string }) {
  const { locale, jaHref, enHref, enAvailable } = getLanguageTargets(pathname, search, hash);
  return <div className="locale-switcher" aria-label={locale === 'en' ? 'Language switcher' : '言語切替'}>
    {locale === 'ja' ? <span className="locale-switcher__current" aria-current="true">JP</span> : <Link href={jaHref} className="locale-switcher__link" hrefLang="ja">JP</Link>}
    {!enAvailable ? <span className="locale-switcher__disabled" title="English is not available for this page">EN</span>
      : locale === 'en' ? <span className="locale-switcher__current" aria-current="true">EN</span> : <Link href={enHref} className="locale-switcher__link" hrefLang="en">EN</Link>}
  </div>;
}

function CurrentLanguageLinks({ pathname }: { pathname: string | null }) {
  const params = useSearchParams();
  const [hash, setHash] = useState('');
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync(); window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [pathname]);
  return <LanguageLinks pathname={pathname} search={params.toString()} hash={hash}/>;
}

export function LocaleSwitcher({ pathname }: { pathname: string | null }) {
  return <Suspense fallback={<LanguageLinks pathname={pathname}/>}><CurrentLanguageLinks pathname={pathname}/></Suspense>;
}
