import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const allItems = [{ label: 'TOP', to: '/' }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="mb-6 animate-fade-in-up">
      <ol className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-mono tracking-wide">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="text-slate-600 mx-2 select-none">/</span>
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="text-slate-500 hover:text-neon-purple transition-colors duration-300"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-300 font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;