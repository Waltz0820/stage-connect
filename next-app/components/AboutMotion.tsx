"use client";

import { useEffect, useRef } from "react";

// Motion is an enhancement: the server-rendered content never starts hidden.
export function AboutMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.16 });
    root.current?.querySelectorAll("[data-about-reveal]").forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return <div ref={root} className="about-experience">{children}</div>;
}
