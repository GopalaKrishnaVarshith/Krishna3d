import { describe, expect, it } from "vitest";
import { createSiteMetadata, injectSiteMetadata } from "../../scripts/siteMetadata";

const fixture = '<link rel="canonical" href="__SITE_URL__"><meta property="og:url" content="__SITE_URL__"><meta property="og:image" content="__SITE_IMAGE_URL__"><script type="application/ld+json">__SITE_JSON_LD__</script>';

describe("production site metadata", () => {
  it("uses the agreed GitHub Pages project URL by default", () => {
    const metadata = createSiteMetadata();
    expect(metadata.url).toBe("https://gopalakrishnavarshith.github.io/Krishna3d/");
    expect(metadata.basePath).toBe("/Krishna3d/");
    expect(metadata.robots).toContain(`${metadata.url}sitemap.xml`);
    expect(metadata.sitemap).toContain(`<loc>${metadata.url}</loc>`);
    expect(injectSiteMetadata(fixture, metadata)).toContain(`href="${metadata.url}"`);
  });

  it("updates raw HTML and crawler files for an alternate origin and base path", () => {
    const metadata = createSiteMetadata("https://portfolio.example.org/work");
    const html = injectSiteMetadata(fixture, metadata);
    expect(metadata.url).toBe("https://portfolio.example.org/work/");
    expect(metadata.basePath).toBe("/work/");
    expect(metadata.robots).toContain("Sitemap: https://portfolio.example.org/work/sitemap.xml");
    expect(metadata.sitemap).toContain("<loc>https://portfolio.example.org/work/</loc>");
    expect(html).toContain('content="https://portfolio.example.org/work/assets/portrait/krishna-portrait.webp"');
    expect(html).not.toContain("__SITE_");
    expect(JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1] || "{}")["@graph"][0].url).toBe(metadata.url);
  });

  it("rejects an invalid deployment URL instead of publishing the default", () => {
    expect(() => createSiteMetadata("not-a-url")).toThrow();
    expect(() => createSiteMetadata("file:///portfolio/")).toThrow(/http or https/);
  });

  it("supports a root-domain deployment and escapes XML-sensitive paths", () => {
    const root = createSiteMetadata("https://portfolio.example.org");
    expect(root.basePath).toBe("/");
    expect(root.imageUrl).toBe("https://portfolio.example.org/assets/portrait/krishna-portrait.webp");
    const nested = createSiteMetadata("https://portfolio.example.org/research&work/");
    expect(nested.sitemap).toContain("research&amp;work/");
    expect(injectSiteMetadata(fixture, nested)).toContain("research&amp;work/");
  });
});
