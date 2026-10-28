import { ActorArchive } from "../../../../components/ActorArchive";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredData } from "../../../../components/StructuredData";
import {
  getActorDetailBySlug,
  toPlainText,
  truncate,
} from "../../../../lib/stage-connect";
import { buildBreadcrumbList } from "../../../../lib/structured-data";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;
export const dynamicParams = true;

const buildActorMetaDescriptionJa = (actor: NonNullable<Awaited<ReturnType<typeof getActorDetailBySlug>>>) => {
  const parts: string[] = [];
  const statusLine = toPlainText(actor.profile || "").trim().replace(/[。．]\s*$/u, "");

  if (statusLine) parts.push(`${statusLine}。`);

  const factParts: string[] = [];
  if (actor.heightCm !== null) factParts.push(`身長${actor.heightCm}cm`);
  if (actor.bloodType) factParts.push(`血液型${actor.bloodType}型`);
  if (factParts.length > 0) parts.push(`${factParts.join("、")}。`);

  if (actor.topSeries.length > 0) {
    const topNames = actor.topSeries.slice(0, 2).map((item) => `『${item.name}』`);
    parts.push(`主な出演シリーズは${topNames.join("など")}。`);
  }

  parts.push(`出演作品数は${actor.plays.length}作。出演年表と共演情報を掲載。`);
  return truncate(parts.join(" "), 150);
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) {
    return {
      title: "俳優が見つかりません | Stage Connect（ステコネ）",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${actor.name} | 俳優詳細 | Stage Connect（ステコネ）`,
    description: buildActorMetaDescriptionJa(actor),
    alternates: {
      canonical: `${siteUrl}/actors/${actor.slug}`,
      languages: {
        ja: `${siteUrl}/actors/${actor.slug}`,
        en: `${siteUrl}/en/actors/${actor.slug}`,
      },
    },
  };
}

export default async function ActorDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) notFound();

  const statusLine = toPlainText(actor.profile || "") || `${actor.name}のプロフィール情報はまだありません。`;

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: actor.name,
    alternateName: actor.kana || undefined,
    description: statusLine,
    url: `${siteUrl}/actors/${actor.slug}`,
    birthDate: actor.birthday || undefined,
    sameAs: Object.values(actor.sns || {}).filter(Boolean),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${actor.name}の出演作品はどこで見られますか？`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "出演年表から各作品の詳細を確認できます。",
        },
      },
      {
        "@type": "Question",
        name: "配信で見られる作品はありますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "各作品の配信情報欄でリンクと視聴条件をご確認ください。",
        },
      },
      {
        "@type": "Question",
        name: "最新の出演情報はどこで確認できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "最新情報は公式サイトやSNSでご確認ください。登録済みのリンクは「公式リンク」に掲載しています。",
        },
      },
    ],
  };

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "TOP", path: "/" },
    { name: "俳優一覧", path: "/actors" },
    { name: actor.name, path: `/actors/${actor.slug}` },
  ]);

  return <ActorArchive actor={actor} locale="ja">
    <StructuredData data={breadcrumbJsonLd} />
    <StructuredData data={personJsonLd} />
    <StructuredData data={faqJsonLd} />
  </ActorArchive>;
}
