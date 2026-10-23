'use client';

import { useEffect } from 'react';

/** Each section assembles once. Canceling motion restores the usable HTML underneath. */
export function ArchiveHomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.editorial-home');
    if (!root || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Map<Element, Set<Animation>>();
    const revealed = new WeakSet<Element>();
    const ease = 'cubic-bezier(.16,.8,.22,1)';

    const play = (element: Element, frames: Keyframe[], duration: number, delay = 0) => {
      const animation = element.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
      const running = animations.get(element) ?? new Set<Animation>();
      running.add(animation);
      animations.set(element, running);
      const forget = () => {
        running.delete(animation);
        if (!running.size && animations.get(element) === running) animations.delete(element);
      };
      animation.addEventListener('finish', forget, { once: true });
      animation.addEventListener('cancel', forget, { once: true });
    };

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || preference.matches || revealed.has(entry.target)) continue;
        const element = entry.target as HTMLElement;
        revealed.add(element);
        observer.unobserve(element);
        if (element.contains(document.activeElement)) continue;
        if (element.matches('.archive-pathways')) {
          const trace = element.querySelector('.archive-pathways__trace');
          if (trace) play(trace, [
            { transform: window.matchMedia('(min-width:740px)').matches ? 'scaleX(0)' : 'scaleY(0)' },
            { transform: 'scale(1)' },
          ], 1100, 100);
          continue;
        }

        const siblings = element.parentElement ? Array.from(element.parentElement.children).filter(node => node.matches('[data-reveal], .oshi-discovery__grid a')) : [];
        const index = Math.max(0, siblings.indexOf(element));
        const kind = element.dataset.reveal;
        if (kind === 'path') {
          play(element, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], 650, index * 90);
          const label = element.firstElementChild;
          if (label) play(label, [{ transform: 'translateX(-18px)' }, { transform: 'translateX(0)' }], 650, index * 90);
        } else if (kind === 'series') {
          play(element, [
            { opacity: .35, transform: 'translateY(30px) scale(.97)', clipPath: 'inset(0 0 9% 0)' },
            { opacity: 1, transform: 'translateY(0) scale(1)', clipPath: 'inset(0 0 0 0)' },
          ], 720, index * 85);
        } else if (element.matches('.oshi-discovery__grid a')) {
          play(element, [{ opacity: .4, transform: 'translateY(12px) scale(.95)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], 420, (index % 5) * 45);
        } else {
          play(element, [{ opacity: .45, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], 600);
        }
      }
    }, { threshold: .12 });

    const targets = root.querySelectorAll('[data-reveal], .oshi-discovery__grid a, .archive-pathways');
    const applyPreference = () => {
      observer.disconnect();
      if (preference.matches) {
        animations.forEach(running => running.forEach(animation => animation.cancel()));
        animations.clear();
      } else {
        targets.forEach(element => { if (!revealed.has(element)) observer.observe(element); });
      }
    };
    const finishInteraction = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const item = event.target.closest('[data-reveal], .oshi-discovery__grid a');
      if (!item || !root.contains(item)) return;
      revealed.add(item);
      observer.unobserve(item);
      animations.forEach((running, element) => {
        if (item === element || item.contains(element)) running.forEach(animation => animation.cancel());
      });
    };

    applyPreference();
    preference.addEventListener('change', applyPreference);
    root.addEventListener('focusin', finishInteraction);
    root.addEventListener('pointerdown', finishInteraction);
    return () => {
      observer.disconnect();
      animations.forEach(running => running.forEach(animation => animation.cancel()));
      preference.removeEventListener('change', applyPreference);
      root.removeEventListener('focusin', finishInteraction);
      root.removeEventListener('pointerdown', finishInteraction);
    };
  }, []);
  return null;
}
