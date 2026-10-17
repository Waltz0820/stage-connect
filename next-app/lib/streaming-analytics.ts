import { getStreamingService } from './streaming-links';

export type StreamingClickContext = { origin: string; pathname: string; placement: string; playId?: string; playSlug?: string };
export function describeStreamingClick(href: string, context: StreamingClickContext) {
  const { origin, pathname, placement } = context;
  if (!placement || !/^[a-z_]{1,40}$/.test(placement) || /^\/admin(?:\/|$)/.test(pathname)) return null;
  try {
    const url = new URL(href, origin);
    const guide = url.origin === origin && /^(?:\/en)?\/watch(?:\/(dmm|u-next|danime))?\/?$/.exec(url.pathname);
    const service = guide ? ({ dmm: 'dmm', 'u-next': 'unext', danime: 'danime' }[guide[1]] ?? 'all') : getStreamingService(url.href);
    if (!service) return null;
    const localPath = pathname.replace(/^\/en(?:\/|$)/, '/') || '/';
    const pageType = localPath === '/' ? 'home' : localPath.split('/')[1];
    const playSlug = context.playSlug || (/^\/plays\/([^/]+)$/.exec(localPath)?.[1] ?? '');
    return {
      streaming_service: service, placement, link_kind: guide ? 'guide' : 'outbound',
      site_locale: pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ja',
      page_type: pageType,
      ...(context.playId && /^[\da-f-]{36}$/i.test(context.playId) ? { play_id: context.playId } : {}),
      ...(playSlug && /^[a-z\d_-]{1,100}$/i.test(playSlug) ? { play_slug: playSlug } : {}),
      page_path: pathname, page_location: origin + pathname,
    };
  } catch { return null; }
}

type ClickEvent = { button: number; defaultPrevented: boolean; target: EventTarget | null };
/** Observe navigation, never intercept or delay it. Native keyboard clicks use button=0. */
export function observeStreamingClick(event: ClickEvent, emit: (name: string, parameters: Record<string, string>) => void) {
  if (event.defaultPrevented || (event.button !== 0 && event.button !== 1) || !(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  const scope = link?.closest<HTMLElement>('[data-streaming-placement]');
  if (!link || !scope) return;
  const play = link.closest<HTMLElement>('[data-play-id]');
  const parameters = describeStreamingClick(link.href, {
    origin: window.location.origin, pathname: window.location.pathname,
    placement: scope.dataset.streamingPlacement ?? '', playId: play?.dataset.playId, playSlug: play?.dataset.playSlug,
  });
  if (parameters) emit('streaming_click', parameters);
}
