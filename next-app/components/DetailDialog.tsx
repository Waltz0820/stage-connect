"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cycleDialogFocus } from "../lib/dialog-focus";

export function DetailDialog({ open, onClose, label, children, className = "" }: { open: boolean; onClose: () => void; label: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const body = document.body;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const previous = {
      overflow: body.style.overflow, position: body.style.position,
      top: body.style.top, left: body.style.left, width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    const paddingRight = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // iOS can scroll the page while focusing a modal. Freeze it before showModal().
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    if (scrollbarGap > 0) body.style.paddingRight = `${paddingRight + scrollbarGap}px`;
    dialog.showModal();
    dialog.scrollTop = 0;
    return () => {
      dialog.close();
      Object.assign(body.style, previous);
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
      opener?.focus({ preventScroll: true });
    };
  }, [open]);

  return <dialog ref={ref} className={`editorial-detail-dialog ${className}`.trim()} aria-label={label}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClose={onClose}
    onClick={(event) => {
      if (event.target === event.currentTarget || (event.target instanceof Element && event.target.closest("a[href]"))) onClose();
    }}
    onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      if (cycleDialogFocus(event.currentTarget, event.shiftKey)) event.preventDefault();
    }}>{children}</dialog>;
}
