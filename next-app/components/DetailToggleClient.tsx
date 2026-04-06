"use client";

import { usePathname } from "next/navigation";
import { useId, useState } from "react";

type DetailToggleClientProps = {
  summary: string;
  closeLabel?: string;
  children: React.ReactNode;
};

export function DetailToggleClient({ summary, closeLabel, children }: DetailToggleClientProps) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith("/en");
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();
  const resolvedCloseLabel = closeLabel ?? (isEnglish ? "Close" : "閉じる");

  return (
    <div className={`detail-toggle${isOpen ? " is-open" : ""}`}>
      <button
        type="button"
        className="detail-toggle__button detail-toggle__button--open"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(true)}
      >
        {summary}
      </button>

      <div className="detail-panel detail-toggle__panel" id={contentId}>
        <div className="detail-toggle__content">{children}</div>
        <div className="detail-toggle__actions">
          <button type="button" className="detail-toggle__button" onClick={() => setIsOpen(false)}>
            {resolvedCloseLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
