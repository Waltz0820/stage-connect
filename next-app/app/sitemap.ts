import type { MetadataRoute } from "next";
import { getActorList, getGuideList, getPlayList, getSeriesList } from "../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [plays, actors, seriesList, guides] = await Promise.all([
    getPlayList(),
    getActorList(),
    getSeriesList(),
    getGuideList(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/en",
    "/plays",
    "/en/plays",
    "/actors",
    "/series",
    "/en/series",
    "/guide",
    "/watch",
    "/watch/dmm",
    "/watch/u-next",
    "/watch/danime",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const playRoutes: MetadataRoute.Sitemap = plays.map((play) => ({
    url: `${siteUrl}/plays/${play.slug}`,
    lastModified: play.createdAt ? new Date(play.createdAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const englishPlayRoutes: MetadataRoute.Sitemap = plays.map((play) => ({
    url: `${siteUrl}/en/plays/${play.slug}`,
    lastModified: play.createdAt ? new Date(play.createdAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const actorRoutes: MetadataRoute.Sitemap = actors.map((actor) => ({
    url: `${siteUrl}/actors/${actor.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const seriesRoutes: MetadataRoute.Sitemap = seriesList.map((series) => ({
    url: `${siteUrl}/series/${series.slug}`,
    lastModified: series.updatedAt ? new Date(series.updatedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const englishSeriesRoutes: MetadataRoute.Sitemap = seriesList.map((series) => ({
    url: `${siteUrl}/en/series/${series.slug}`,
    lastModified: series.updatedAt ? new Date(series.updatedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const guideRoutes: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${siteUrl}/guide/${guide.slug}`,
    lastModified: guide.publishedAt ? new Date(guide.publishedAt) : undefined,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [
    ...staticRoutes,
    ...playRoutes,
    ...englishPlayRoutes,
    ...actorRoutes,
    ...seriesRoutes,
    ...englishSeriesRoutes,
    ...guideRoutes,
  ];
}
