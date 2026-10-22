"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { DetailDialog } from "./DetailDialog";

/** One set of native form controls: draft choices survive closing and reopening. */
export function DirectoryFilterSheet({ locale, children }: { locale: "ja" | "en"; children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const draft = useRef<Map<string, string> | null>(null);
  const en = locale === "en";
  const title = en ? "Filter productions" : "絞り込み条件";
  useEffect(() => {
    const media = window.matchMedia("(max-width: 739px)");
    const update = () => {
      if (container.current) draft.current = new Map(Array.from(container.current.querySelectorAll<HTMLSelectElement>("select[name]"), select => [select.name, select.value]));
      setMobile(media.matches);
      setOpen(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    if (!draft.current || !container.current) return;
    for (const select of container.current.querySelectorAll<HTMLSelectElement>("select[name]")) {
      const value = draft.current.get(select.name);
      if (value !== undefined) select.value = value;
    }
  }, [mobile]);

  return <div className="directory-filter" ref={container}>
    <button type="button" className="directory-filter__trigger" onClick={() => setOpen(true)} aria-haspopup="dialog">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18M3 12h18M3 18h18"/><path d="M8 3v6m8 0v6m-8 0v6"/></svg>
      {en ? "Filters" : "絞り込む"}
    </button>
    {mobile ? <DetailDialog open={open} onClose={() => setOpen(false)} label={title} className="directory-filter-dialog">
      <div className="directory-filter__header"><h2>{title}</h2><button type="button" onClick={() => setOpen(false)} aria-label={en ? "Close filters" : "絞り込みを閉じる"}>×</button></div>
      <div className="directory-filter__body">{children}</div>
    </DetailDialog> : <div className="directory-filter__inline">{children}</div>}
    <noscript><style>{".directory-filter__inline{display:block!important}.directory-filter__trigger{display:none!important}"}</style></noscript>
  </div>;
}
