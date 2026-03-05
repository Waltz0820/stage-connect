import { useMemo } from 'react';

/**
 * VITE_SITE_URL → window.location.origin の優先順で siteUrl を取得
 */
export function useSiteUrl(): string {
    return useMemo(() => {
        const envUrl = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
        if (envUrl) return envUrl.replace(/\/$/, '');
        if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
        return '';
    }, []);
}

/**
 * VITE_OG_IMAGE env から OG 画像 URL を取得
 */
export function useOgImage(): string {
    return useMemo(() => {
        const envOg = (import.meta as any)?.env?.VITE_OG_IMAGE as string | undefined;
        return envOg ?? '';
    }, []);
}
