"use client";

import { useRef, type ComponentProps } from "react";

/** Keep ordinary GET forms, while Enter confirms IME text before submitting. */
export function DirectorySearchForm(props: ComponentProps<"form">) {
  const composing = useRef(false);
  return <form {...props}
    onCompositionStart={() => { composing.current = true; }}
    onCompositionEnd={() => { composing.current = false; }}
    onKeyDown={(event) => {
      if (event.key === "Enter" && (composing.current || event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
    }} />;
}
