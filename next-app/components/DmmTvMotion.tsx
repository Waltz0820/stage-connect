'use client';

import { useEffect } from 'react';

export function DmmTvMotion() {
  useEffect(() => {
    const root = document.querySelector('.dmm-tv-landing');
    if (!root || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const revealed = new WeakSet<Element>();
    const running = new Map<Element, Animation>();
    const targets = root.querySelectorAll<HTMLElement>('[data-dmm-reveal]');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || preference.matches || revealed.has(entry.target)) continue;
        const element = entry.target as HTMLElement;
        revealed.add(element); observer.unobserve(element);
        if (element.contains(document.activeElement)) continue;
        const siblings = element.parentElement ? Array.from(element.parentElement.children).filter(node => node.matches('[data-dmm-reveal]')) : [];
        const index = Math.max(0, siblings.indexOf(element));
        const animation = element.animate([{ opacity: .45, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 400, delay: index * 70, easing: 'cubic-bezier(.16,.8,.22,1)', fill: 'backwards' });
        running.set(element, animation);
        const forget = () => running.delete(element);
        animation.addEventListener('finish', forget, { once: true });
        animation.addEventListener('cancel', forget, { once: true });
      }
    }, { threshold: .12 });
    const applyPreference = () => {
      observer.disconnect();
      if (preference.matches) { running.forEach(animation => animation.cancel()); running.clear(); }
      else targets.forEach(target => { if (!revealed.has(target)) observer.observe(target); });
    };
    applyPreference(); preference.addEventListener('change', applyPreference);
    return () => { observer.disconnect(); running.forEach(animation => animation.cancel()); preference.removeEventListener('change', applyPreference); };
  }, []);
  return null;
}
