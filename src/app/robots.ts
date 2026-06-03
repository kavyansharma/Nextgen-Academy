import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nextgenacademy.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/portal/dashboard",
        "/portal/admin",
        "/portal/profile",
        "/portal/settings",
        "/portal/support",
        "/portal/community",
        "/portal/courses",
        "/portal/certificates",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
