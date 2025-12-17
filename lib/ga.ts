// src/lib/ga.ts
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export function gaPageView(path: string) {
  if (!GA_ID) return;
  if (import.meta.env.DEV) return; // ローカルでは送らない（必要なら削除）
  if (!window.gtag) return;

  // 管理画面は除外（計測したければ消す）
  if (path.startsWith("/admin")) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
