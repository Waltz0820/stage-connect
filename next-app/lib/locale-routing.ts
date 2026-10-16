export type SiteLocale = "ja" | "en";
const translatedPath = /^\/(?:actors|plays|series)(?:\/[^/]+)?$/;

export function getLanguageTargets(pathname: string | null, search = '', hash = '') {
  const path = (pathname ?? "/").replace(/\/+$/, "") || "/";
  const locale: SiteLocale = path === "/en" || path.startsWith("/en/") ? "en" : "ja";
  const jaPath = locale === "en" ? path.slice(3) || "/" : path;
  const allowed = jaPath === '/search' ? ['q'] : jaPath === '/actors' ? ['q', 'gender', 'page']
    : jaPath === '/series' ? ['q', 'sort', 'format', 'origin', 'page']
    : jaPath === '/plays' ? ['q', 'sort', 'format', 'genre', 'point', 'series', 'streaming', 'page'] : [];
  const source = new URLSearchParams(search);
  const params = new URLSearchParams();
  for (const key of allowed) { const value = source.get(key); if (value) params.set(key, value); }
  const suffix = (params.size ? `?${params}` : '') + (hash.startsWith('#') ? hash : '');
  const jaHref = jaPath + suffix;
  const enHref = (jaPath === "/" ? "/en" : `/en${jaPath}`) + suffix;
  return { locale, jaHref, enHref, enAvailable: jaPath === "/" || jaPath === "/search" || translatedPath.test(jaPath) };
}

export const isAdminPath = (pathname: string | null) => pathname === "/admin" || Boolean(pathname?.startsWith("/admin/"));
