import type { PortfolioData } from "../data/types.ts";

export const DESTINATIONS = [
  { id: "plaza", label: "Arrival Plaza", hint: "Meet Krishna and choose a path" },
  { id: "automation-lab", label: "Automation Lab", hint: "Workflow and engineering" },
  { id: "evidence-vault", label: "Project Portfolio", hint: "Eleven selected projects" },
  { id: "observatory", label: "Regulatory Observatory", hint: "Regulatory data and quality" },
  { id: "career-trail", label: "Career Experience", hint: "Eight professional roles" },
  { id: "contact-portal", label: "Contact Portal", hint: "Get in touch" },
] as const;

export type ZoneId = (typeof DESTINATIONS)[number]["id"];
export type Theme = "night" | "day";

export const DEFAULT_SITE_URL = "https://gopalakrishnavarshith.github.io/krishna-three-portfolio/";

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export function siteUrl(configured?: string): string {
  try {
    const url = new URL(configured || DEFAULT_SITE_URL);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid site URL");
    url.hash = "";
    url.search = "";
    if (!url.pathname.endsWith("/")) url.pathname += "/";
    return url.href;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function assetUrl(path: string, base = import.meta.env.BASE_URL || "/"): string {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function updateMetadata(data: PortfolioData, configuredSiteUrl?: string): void {
  const url = siteUrl(configuredSiteUrl || import.meta.env.VITE_SITE_URL);
  const title = `${data.profile.name} — Regulatory Technology & Responsible AI`;
  const description = `${data.profile.name} builds regulatory workflows, document quality systems, automation, and responsible AI. Explore eleven projects and eight experience roles.`;
  document.title = title;
  const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
    let element = document.head.querySelector<HTMLMetaElement>(selector);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.append(element);
    }
    element.content = content;
  };
  setMeta('meta[name="description"]', "name", "description", description);
  setMeta('meta[property="og:title"]', "property", "og:title", title);
  setMeta('meta[property="og:description"]', "property", "og:description", description);
  setMeta('meta[property="og:url"]', "property", "og:url", url);
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = url;
  const image = new URL(assetUrl(data.profile.portrait, new URL(url).pathname), url).href;
  setMeta('meta[property="og:image"]', "property", "og:image", image);
  setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
  let schema = document.head.querySelector<HTMLScriptElement>('script[data-portfolio-schema]');
  if (!schema) {
    schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.dataset.portfolioSchema = "";
    document.head.append(schema);
  }
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${url}#person`,
        name: data.profile.name,
        jobTitle: data.profile.title,
        email: `mailto:${data.profile.email}`,
        url,
        sameAs: [data.profile.linkedin],
        image,
        address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressCountry: "IN" },
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: `${data.profile.name} — Portfolio`,
        url,
        description,
        author: { "@id": `${url}#person` },
      },
    ],
  }).replace(/</g, "\\u003c");
}
