import React from 'react';

interface TagBadgeProps {
  children: React.ReactNode;
}

const TagBadge: React.FC<TagBadgeProps> = ({ children }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10 tracking-wider shadow-sm backdrop-blur-sm group-hover:border-neon-purple/30 group-hover:text-white transition-colors duration-300">
      #{children}
    </span>
  );
};

export default TagBadge;