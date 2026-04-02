"use client";

import { useState } from "react";

type ActorProfileClientProps = {
  text: string;
  collapsed?: boolean;
};

export function ActorProfileClient({ text, collapsed = false }: ActorProfileClientProps) {
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
            {isExpanded ? "閉じる" : "続きを読む"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
