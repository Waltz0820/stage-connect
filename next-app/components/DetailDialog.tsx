"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function DetailDialog({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previousOverflow = document.body.style.overflow;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, [open]);

  return <dialog ref={ref} className="editorial-detail-dialog" aria-label={label}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClose={onClose}
    onClick={(event) => {
      if (event.target === event.currentTarget || (event.target instanceof Element && event.target.closest("a[href]"))) onClose();
    }}
    onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex="0"]'))
        .filter((node) => !node.closest('[inert]') && node.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>{children}</dialog>;
}
