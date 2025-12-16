import React from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
};

const JsonArea: React.FC<Props> = ({ value, onChange, placeholder, rows = 10 }) => {
  return (
    <textarea
      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none font-mono text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
};

export default JsonArea;
