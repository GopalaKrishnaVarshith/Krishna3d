import { portfolioData } from "../src/data/portfolioData.ts";
import { escapeHtml, siteUrl } from "../src/ui/templates.ts";

export interface SiteMetadata {
  url: string;
  basePath: string;
  imageUrl: string;
  jsonLd: string;
  robots: string;
  sitemap: string;
}

export function createSiteMetadata(configuredUrl?: string): SiteMetadata {
  if (configuredUrl) {
    const candidate = new URL(configuredUrl);
    if (!(["http:", "https:"].includes(candidate.protocol))) {
      throw new Error("VITE_SITE_URL must use http or https");
    }
  }
  const url = siteUrl(configuredUrl);
  const basePath = new URL(url).pathname;
  const imageUrl = new URL(portfolioData.profile.portrait.replace(/^\//, ""), url).href;
  const description = `${portfolioData.profile.name} builds regulatory workflows, document quality systems, automation, and responsible AI. Explore eleven projects and eight experience roles.`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${url}#person`,
        name: portfolioData.profile.name,
        jobTitle: portfolioData.profile.title,
        email: `mailto:${portfolioData.profile.email}`,
        url,
        sameAs: [portfolioData.profile.linkedin],
        image: imageUrl,
        address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressCountry: "IN" },
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: `${portfolioData.profile.name} — Portfolio`,
        url,
        description,
        author: { "@id": `${url}#person` },
      },
    ],
  }).replace(/</g, "\\u003c");
  return {
    url,
    basePath,
    imageUrl,
    jsonLd,
    robots: `User-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`,
    sitemap: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escapeHtml(url)}</loc></url>\n</urlset>\n`,
  };
}

export function injectSiteMetadata(html: string, metadata: SiteMetadata): string {
  for (const marker of ["__SITE_URL__", "__SITE_IMAGE_URL__", "__SITE_JSON_LD__"]) {
    if (!html.includes(marker)) throw new Error(`Missing HTML site metadata marker: ${marker}`);
  }
  return html
    .replaceAll("__SITE_URL__", () => escapeHtml(metadata.url))
    .replaceAll("__SITE_IMAGE_URL__", () => escapeHtml(metadata.imageUrl))
    .replaceAll("__SITE_JSON_LD__", () => metadata.jsonLd);
}
