"use client";

import { useState } from "react";

type DetailToggleClientProps = {
  summary: string;
  closeLabel?: string;
  children: React.ReactNode;
};

export function DetailToggleClient({
  summary,
  closeLabel = "閉じる",
  children,
}: DetailToggleClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="detail-toggle">
      {!isOpen ? (
        <button
          type="button"
          className="detail-toggle__button"
          onClick={() => setIsOpen(true)}
        >
          {summary}
        </button>
      ) : (
        <div className="detail-panel">
          {children}
          <div className="detail-toggle__actions">
            <button
              type="button"
              className="detail-toggle__button"
              onClick={() => setIsOpen(false)}
            >
              {closeLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
