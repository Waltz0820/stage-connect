'use client';

import { useEffect } from 'react';

/** Progressive enhancement: content stays visible without JS, observers or animation support. */
export function ArchiveHomeMotion() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const element = entry.target as HTMLElement;
        const point = element.matches('.oshi-discovery__grid a');
        const distance = point ? 9 : element.dataset.reveal === 'path' ? 16 : 13;
        const duration = point ? 340 : element.dataset.reveal === 'path' ? 490 : 470;
        const animation = element.animate([
          { opacity: .1, transform: 'translateY(' + distance + 'px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration, easing: 'cubic-bezier(.2,.7,.2,1)' });
        animations.add(animation);
        animation.addEventListener('finish', () => animations.delete(animation), { once: true });
      }
    }, { threshold: .08 });
    document.querySelectorAll('.editorial-home [data-reveal], .editorial-home .oshi-discovery__grid a').forEach(element => observer.observe(element));
    const stop = () => {
      if (!preference.matches) return;
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
    };
    preference.addEventListener('change', stop);
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); preference.removeEventListener('change', stop); };
  }, []);
  return null;
}
