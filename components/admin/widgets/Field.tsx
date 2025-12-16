import React from "react";

type Props = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

const Field: React.FC<Props> = ({ label, hint, children }) => {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-xs font-bold tracking-widest uppercase text-slate-300">
          {label}
        </div>
        {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
      </div>
      {children}
    </div>
  );
};

export default Field;
