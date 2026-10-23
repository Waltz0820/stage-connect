"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Tab = { id: string; label: string };

/** Real anchors remain usable without JavaScript; active state follows reading position. */
export function AnchorTabs({ items, label }: { items: Tab[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const navRef = useRef<HTMLElement>(null);
  const ids = items.map((item) => item.id).join(",");

  useEffect(() => {
    const sections = ids.split(",").map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    let frame = 0;
    const update = () => {
      frame = 0;
      const nav = navRef.current;
      const offset = (nav ? (Number.parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight : 120) + 32;
      const passed = sections.filter((section) => section.getBoundingClientRect().top <= offset)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      setActive((passed.at(-1) ?? sections[0])?.id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return <nav ref={navRef} className="detail-contents-nav" aria-label={label}>
    {items.map((item) => <Link key={item.id} href={`#${item.id}`} prefetch={false} aria-current={active === item.id ? "location" : undefined} onClick={() => setActive(item.id)}>{item.label}</Link>)}
  </nav>;
}
