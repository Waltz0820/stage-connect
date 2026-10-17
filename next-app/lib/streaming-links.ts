export type StreamingService = 'dmm' | 'unext' | 'danime';
const hosts: Record<StreamingService, readonly string[]> = {
  dmm: ['dmm.com', 'dmm.co.jp'], unext: ['video.unext.jp', 'www.video.unext.jp', 'unext.jp'], danime: ['animestore.docomo.ne.jp'],
};

export function getStreamingService(href: string, depth = 0): StreamingService | null {
  if (depth > 2) return null;
  try {
    const url = new URL(href);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    for (const service of Object.keys(hosts) as StreamingService[]) {
      if (hosts[service].some(host => url.hostname === host || (service === 'dmm' && url.hostname.endsWith(`.${host}`)))) {
        if (url.hostname === 'al.dmm.com') {
          const destination = url.searchParams.get('lurl');
          if (!destination || getStreamingService(destination, depth + 1) !== 'dmm') return null;
        }
        return service;
      }
    }
  } catch { /* Empty, placeholder and malformed values have no actionable destination. */ }
  return null;
}

/** Read-time cleanup only. Preserve saved URLs and affiliate parameters verbatim. */
export function normalizeVod(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const aliases: Record<string, StreamingService> = { dmm: 'dmm', dmm_tv: 'dmm', 'dmm-tv': 'dmm', dmmtv: 'dmm', unext: 'unext', 'u-next': 'unext', danime: 'danime' };
  const links: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    const service = aliases[key.toLowerCase()];
    const href = typeof raw === 'string' ? raw.trim() : '';
    if (service && !links[service] && getStreamingService(href) === service) links[service] = href;
  }
  return Object.keys(links).length ? links : null;
}
