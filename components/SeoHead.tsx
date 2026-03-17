import { useEffect } from "react";

type MetaKV = { name?: string; property?: string; content?: string };
type LinkKV = { rel: string; href: string };

type Props = {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  metas?: MetaKV[];
  jsonLd?: any | any[];
};

export default function SeoHead({
  title,
  description,
  canonical,
  robots,
  metas = [],
  jsonLd,
}: Props) {
  useEffect(() => {
    const desiredMetaSelectors = new Set<string>();
    const desiredLinkSelectors = new Set<string>();

    if (title) document.title = title;

    const ensureMeta = (key: { name?: string; property?: string }, content?: string) => {
      const attr = key.name ? "name" : "property";
      const value = key.name ?? key.property;
      if (!value) return;

      const selector = `meta[${attr}="${CSS.escape(value)}"][data-seo="1"]`;
      desiredMetaSelectors.add(selector);
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;

      if (!content) {
        if (el) el.remove();
        return;
      }

      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("data-seo", "1");
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }

      el.setAttribute("content", content);
    };

    const ensureLink = (link: LinkKV) => {
      const selector = `link[rel="${CSS.escape(link.rel)}"][data-seo="1"]`;
      desiredLinkSelectors.add(selector);
      let el = document.head.querySelector(selector) as HTMLLinkElement | null;

      if (!link.href) {
        if (el) el.remove();
        return;
      }

      if (!el) {
        el = document.createElement("link");
        el.setAttribute("data-seo", "1");
        el.setAttribute("rel", link.rel);
        document.head.appendChild(el);
      }

      el.setAttribute("href", link.href);
    };

    const ensureJsonLd = (payload: any | any[] | undefined) => {
      const id = "seo-jsonld";
      let el = document.head.querySelector(`script#${CSS.escape(id)}`) as HTMLScriptElement | null;

      if (!payload) {
        if (el) el.remove();
        return;
      }

      if (!el) {
        el = document.createElement("script");
        el.id = id;
        el.type = "application/ld+json";
        el.setAttribute("data-seo", "1");
        document.head.appendChild(el);
      }

      el.text = JSON.stringify(payload);
    };

    ensureMeta({ name: "description" }, description);
    ensureMeta({ name: "robots" }, robots);
    ensureLink({ rel: "canonical", href: canonical || "" });

    metas.forEach((meta) => {
      if (meta.name) ensureMeta({ name: meta.name }, meta.content);
      if (meta.property) ensureMeta({ property: meta.property }, meta.content);
    });

    ensureJsonLd(jsonLd);

    document.head.querySelectorAll('meta[data-seo="1"]').forEach((node) => {
      const el = node as HTMLMetaElement;
      const attr = el.getAttribute("name") ? "name" : el.getAttribute("property") ? "property" : "";
      const value = attr ? el.getAttribute(attr) : "";
      if (!attr || !value) return;

      const selector = `meta[${attr}="${CSS.escape(value)}"][data-seo="1"]`;
      if (!desiredMetaSelectors.has(selector)) el.remove();
    });

    document.head.querySelectorAll('link[data-seo="1"]').forEach((node) => {
      const el = node as HTMLLinkElement;
      const rel = el.getAttribute("rel");
      if (!rel) return;

      const selector = `link[rel="${CSS.escape(rel)}"][data-seo="1"]`;
      if (!desiredLinkSelectors.has(selector)) el.remove();
    });
  }, [title, description, canonical, robots, JSON.stringify(metas), JSON.stringify(jsonLd)]);

  return null;
}
