const catalogueTables = new Set(['actors', 'plays', 'casts', 'franchises']);
const catalogueRpcs = new Set(['accept_external_work_cast_candidate', 'accept_external_cast_candidate', 'register_reviewed_work_actor']);

export async function refreshDirectory(token, fetcher = fetch) {
  if (!token) throw new Error('管理画面へログインしてください。');
  const response = await fetcher('/api/admin/revalidate-directory', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('一覧の更新に失敗しました。もう一度お試しください。');
}

// Preserve the successful database response even if cache invalidation is unavailable.
export function createCatalogueFetch(supabaseUrl, fetcher = fetch, invalidate = refreshDirectory) {
  return async (input, init) => {
    const response = await fetcher(input, init);
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const parts = url.pathname.split('/').filter(Boolean);
    const changesCatalogue = parts[0] === 'rest' && parts[1] === 'v1' && (
      catalogueTables.has(parts[2]) || (parts[2] === 'rpc' && catalogueRpcs.has(parts[3]))
    );
    if (response.ok && ['POST', 'PATCH', 'DELETE'].includes(method) &&
        url.origin === new URL(supabaseUrl).origin && changesCatalogue) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      const token = headers.get('authorization')?.replace(/^Bearer\s+/i, '');
      if (token) { try { await invalidate(token); } catch { /* TTL / manual refresh remains available. */ } }
    }
    return response;
  };
}
