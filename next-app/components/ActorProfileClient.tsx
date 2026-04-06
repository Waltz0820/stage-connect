"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

type ActorProfileClientProps = {
  text: string;
  collapsed?: boolean;
};

export function ActorProfileClient({ text, collapsed = false }: ActorProfileClientProps) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith("/en");
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  return (
    <div className="stack-sm">
      <div className={`rich-text${!isExpanded ? " rich-text--clamped" : ""}`}>{text}</div>
      {collapsed ? (
        <div className="action-row" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            className="action-button"
            style={{ width: "auto", minWidth: 0 }}
            onClick={() => setIsExpanded((value) => !value)}
          >
            {isExpanded ? (isEnglish ? "Close" : "閉じる") : isEnglish ? "Read more" : "続きを読む"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
