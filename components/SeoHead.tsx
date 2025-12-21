// src/components/SeoHead.tsx
import { useEffect } from "react";

type MetaKV = { name?: string; property?: string; content?: string };
type LinkKV = { rel: string; href: string };

type Props = {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;

  // OG / Twitter をまとめて渡してOK
  metas?: MetaKV[];

  // JSON-LD（オブジェクト or 配列）
  jsonLd?: any | any[];
};

/**
 * Helmetが入らない環境向けの「簡易SEO Head」。
 * document.head に対して meta/link/script を upsert します。
 */
export default function SeoHead({
  title,
  description,
  canonical,
  robots,
  metas = [],
  jsonLd,
}: Props) {
  useEffect(() => {
    // ---- title ----
    if (title) document.title = title;

    // ---- helpers ----
    const ensureMeta = (key: { name?: string; property?: string }, content?: string) => {
      const attr = key.name ? "name" : "property";
      const value = key.name ?? key.property;
      if (!value) return;

      const selector = `meta[${attr}="${CSS.escape(value)}"][data-seo="1"]`;
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

    // ---- base metas ----
    ensureMeta({ name: "description" }, description);
    ensureMeta({ name: "robots" }, robots);

    // ---- canonical ----
    ensureLink({ rel: "canonical", href: canonical || "" });

    // ---- custom metas (og/twitter/anything) ----
    metas.forEach((m) => {
      if (m.name) ensureMeta({ name: m.name }, m.content);
      if (m.property) ensureMeta({ property: m.property }, m.content);
    });

    // ---- json-ld ----
    ensureJsonLd(jsonLd);

    // cleanupは基本不要（遷移時に上書きされる）
  }, [title, description, canonical, robots, JSON.stringify(metas), JSON.stringify(jsonLd)]);

  return null;
}
