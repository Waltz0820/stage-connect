export function refreshDirectory(token: string | undefined, fetcher?: typeof fetch): Promise<void>;
export function createCatalogueFetch(supabaseUrl: string, fetcher?: typeof fetch, invalidate?: (token: string) => Promise<void>): typeof fetch;
