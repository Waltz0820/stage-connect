"use client";

import { useEffect } from 'react';
import { observeStreamingClick } from '../lib/streaming-analytics';

export function StreamingClickTracker() {
  useEffect(() => {
    const capture = (event: MouseEvent) => {
      try {
        observeStreamingClick(event, (name, parameters) => window.gtag?.('event', name, { ...parameters, transport_type: 'beacon' }));
      } catch { /* Analytics must never prevent the destination from opening. */ }
    };
    const click = (event: MouseEvent) => { if (event.button === 0) capture(event); };
    const auxiliary = (event: MouseEvent) => { if (event.button === 1) capture(event); };
    // Read the link before Next.js handles navigation or closes the mobile menu.
    document.addEventListener('click', click, true);
    document.addEventListener('auxclick', auxiliary, true);
    return () => { document.removeEventListener('click', click, true); document.removeEventListener('auxclick', auxiliary, true); };
  }, []);
  return null;
}
