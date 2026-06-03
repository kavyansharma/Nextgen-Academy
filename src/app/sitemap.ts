import { MetadataRoute } from "next";
import { resources } from "@/data/resources";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nextgenacademy.com";

  // Static routes
  const staticPaths = [
    "",
    "/about",
    "/services",
    "/contact",
    "/blog",
    "/privacy",
    "/terms",
    "/portal/login",
    "/portal/register",
  ];

  const staticUrls = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1.0 : 0.8,
  }));

  // Dynamic public resource paths
  const resourceUrls = resources.map((res) => ({
    url: `${baseUrl}/resources/${res.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticUrls, ...resourceUrls];
}
