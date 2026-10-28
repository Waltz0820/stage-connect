import { ActorArchive } from "../../../../components/ActorArchive";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredData } from "../../../../components/StructuredData";
import { getActorDetailBySlug, toPlainText } from "../../../../lib/stage-connect";
import {
  getEnglishActorName,
  getEnglishSeriesName,
  truncateText,
} from "../../../../lib/en-copy";
import { buildBreadcrumbList } from "../../../../lib/structured-data";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;
export const dynamicParams = true;

const buildActorMetaDescriptionEn = (actor: NonNullable<Awaited<ReturnType<typeof getActorDetailBySlug>>>) => {
  const parts: string[] = [];
  const statusLine = toPlainText(actor.profileEn || actor.profile || "").trim().replace(/[.。]\s*$/u, "");

  if (statusLine) parts.push(`${statusLine}.`);

  const factParts: string[] = [];
  if (actor.heightCm !== null) factParts.push(`Height ${actor.heightCm} cm`);
  if (actor.bloodType) factParts.push(`Blood type ${actor.bloodType}`);
  if (factParts.length > 0) parts.push(`${factParts.join(", ")}.`);

  if (actor.topSeries.length > 0) {
    const topNames = actor.topSeries
      .slice(0, 2)
      .map((item) => `"${getEnglishSeriesName({ name: item.name, nameEn: item.nameEn })}"`);
    parts.push(`Major series include ${topNames.join(" and ")}.`);
  }

  parts.push(`${actor.plays.length} credited works. Includes appearance timeline and co-star links.`);
  return truncateText(parts.join(" "), 150);
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) {
    return {
      title: "Actor not found | Stage Connect",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const displayName = getEnglishActorName(actor);

  return {
    title: `${displayName} | Actor archive | Stage Connect`,
    description: buildActorMetaDescriptionEn(actor),
    alternates: {
      canonical: `${siteUrl}/en/actors/${actor.slug}`,
      languages: {
        ja: `${siteUrl}/actors/${actor.slug}`,
        en: `${siteUrl}/en/actors/${actor.slug}`,
      },
    },
  };
}

export default async function EnglishActorDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) notFound();

  const displayName = getEnglishActorName(actor);
  const statusLine = toPlainText(actor.profileEn || actor.profile || "") || `${displayName} profile text is not available yet.`;
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    alternateName: actor.name || actor.kana || undefined,
    description: statusLine,
    url: `${siteUrl}/en/actors/${actor.slug}`,
    birthDate: actor.birthday || undefined,
    sameAs: Object.values(actor.sns || {}).filter(Boolean),
  };
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "HOME", path: "/en" },
    { name: "Actors", path: "/en/actors" },
    { name: displayName, path: `/en/actors/${actor.slug}` },
  ]);

  return <ActorArchive actor={actor} locale="en">
    <StructuredData data={breadcrumbJsonLd} />
    <StructuredData data={personJsonLd} />
  </ActorArchive>;
}
