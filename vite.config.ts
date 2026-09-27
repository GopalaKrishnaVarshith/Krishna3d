import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { createSiteMetadata, injectSiteMetadata } from "./scripts/siteMetadata.ts";

export default defineConfig(({ command, mode }) => {
  const metadata = createSiteMetadata(loadEnv(mode, process.cwd(), "VITE_").VITE_SITE_URL);
  let outputDirectory = resolve("dist");
  const siteMetadataPlugin: Plugin = {
    name: "portfolio-site-metadata",
    transformIndexHtml: (html) => injectSiteMetadata(html, metadata),
    configResolved: (config) => { outputDirectory = resolve(config.root, config.build.outDir); },
    closeBundle: async () => {
      if (command !== "build") return;
      await Promise.all([
        writeFile(resolve(outputDirectory, "robots.txt"), metadata.robots),
        writeFile(resolve(outputDirectory, "sitemap.xml"), metadata.sitemap),
      ]);
    },
  };
  return {
    base: command === "build" ? metadata.basePath : "/",
    plugins: [siteMetadataPlugin],
    build: {
      chunkSizeWarningLimit: 650,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: "three", test: /node_modules[\\/]three[\\/]/ },
              { name: "world", test: /[\\/]src[\\/]world[\\/]/ },
              { name: "avatar", test: /[\\/]src[\\/]avatar[\\/]/ },
            ],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      environmentOptions: {
        jsdom: {
          html: "<!doctype html><html><body><div id=\"app\"></div></body></html>",
        },
      },
      include: ["tests/unit/**/*.test.ts"],
      clearMocks: true,
      restoreMocks: true,
    },
  };
});
