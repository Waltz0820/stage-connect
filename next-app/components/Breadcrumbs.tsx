"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: Props) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith("/en");
  const rootItem: BreadcrumbItem = isEnglish ? { label: "HOME", href: "/en" } : { label: "TOP", href: "/" };
  const allItems: BreadcrumbItem[] = [rootItem, ...items];

  return (
    <nav aria-label={isEnglish ? "Breadcrumbs" : "パンくずリスト"} className="breadcrumbs">
      <ol className="breadcrumbs__list">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="breadcrumbs__item">
              {index > 0 ? <span className="breadcrumbs__divider">/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="breadcrumbs__link">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
