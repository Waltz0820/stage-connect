const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

type BreadcrumbEntry = {
  name: string;
  path: string;
};

export const absoluteUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export const buildBreadcrumbList = (items: BreadcrumbEntry[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

type CollectionPageInput = {
  name: string;
  description: string;
  path: string;
};

export const buildCollectionPageStructuredData = ({
  name,
  description,
  path,
}: CollectionPageInput) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  description,
  url: absoluteUrl(path),
  isPartOf: {
    "@type": "WebSite",
    name: "Stage Connect",
    url: siteUrl,
  },
});
