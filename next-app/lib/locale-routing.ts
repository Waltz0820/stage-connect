export type SiteLocale = "ja" | "en";
const translatedPath = /^\/(?:actors|plays|series)(?:\/[^/]+)?$/;

export function getLanguageTargets(pathname: string | null) {
  const path = (pathname ?? "/").replace(/\/+$/, "") || "/";
  const locale: SiteLocale = path === "/en" || path.startsWith("/en/") ? "en" : "ja";
  const jaHref = locale === "en" ? path.slice(3) || "/" : path;
  const enHref = jaHref === "/" ? "/en" : `/en${jaHref}`;
  return { locale, jaHref, enHref, enAvailable: jaHref === "/" || jaHref === "/search" || translatedPath.test(jaHref) };
}

export const isAdminPath = (pathname: string | null) => pathname === "/admin" || Boolean(pathname?.startsWith("/admin/"));
