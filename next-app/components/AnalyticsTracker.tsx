"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function AnalyticsTracker({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPage = useRef('');

  useEffect(() => {
    if (!measurementId || typeof window === "undefined" || typeof window.gtag !== "function" || /^\/admin(?:\/|$)/.test(pathname)) return;

    const search = searchParams?.toString();
    const pagePath = `${pathname}${search ? `?${search}` : ""}`;
    if (previousPage.current === pagePath) return;
    previousPage.current = pagePath;

    window.gtag("set", { page_location: window.location.origin + pathname, page_path: pathname });
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.origin + pathname,
      page_path: pathname,
      send_to: measurementId,
    });
  }, [measurementId, pathname, searchParams]);

  return null;
}
