import type { MetadataRoute } from "next";

const BASE_URL = "https://vestra-simulator.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/conta"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
