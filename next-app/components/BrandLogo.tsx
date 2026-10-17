import type { SiteLocale } from '../lib/locale-routing';

export function BrandLogo({locale}: {locale: SiteLocale}) {
  return <span className="brand-logo">
    <img className="brand-logo__mark" src="/brand/stage-connect-mark.png" width={234} height={256} alt="" aria-hidden="true"/>
    <span className="brand-logo__copy">
      <span className="brand-logo__wordmark">STAGE CONNEC<span className="brand-logo__last-letter">T</span></span>
      <span className="brand-logo__tagline">{locale==='ja'?'2.5次元舞台とキャストをつなぐ':'Connecting 2.5D stage and cast'}</span>
    </span>
  </span>;
}
