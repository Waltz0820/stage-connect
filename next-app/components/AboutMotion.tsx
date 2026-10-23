"use client";

import { useEffect, useRef, useState } from "react";

// Motion is an enhancement: the server-rendered content never starts hidden.
export function AboutMotion({ children, locale }: { children: React.ReactNode; locale: "ja" | "en" }) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.16 });
    root.current?.querySelectorAll("[data-about-reveal]").forEach(section => observer.observe(section));
    return () => { observer.disconnect(); preference.removeEventListener("change", update); };
  }, []);

  return <div ref={root} className={`about-experience${paused || reduced ? " is-paused" : ""}`}>
    {children}
    {!reduced && <button type="button" className="about-motion-control" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
      {locale === "ja" ? (paused ? "動きを再生" : "動きを止める") : (paused ? "Play motion" : "Pause motion")}
    </button>}
  </div>;
}
