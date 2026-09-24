import { describe, expect, it } from "vitest";
import { portfolioData } from "../../src/data/portfolioData";

describe("public portfolio data", () => {
  it("contains the approved project, experience, and skill domain counts", () => {
    expect(portfolioData.projects).toHaveLength(11);
    expect(portfolioData.experience).toHaveLength(8);
    expect(portfolioData.skillDomains).toHaveLength(4);
  });

  it("provides complete project essentials", () => {
    expect(
      portfolioData.projects.every(
        (project) => project.id && project.title && project.outcome,
      ),
    ).toBe(true);
  });

  it("does not expose confidential internal tool names", () => {
    expect(JSON.stringify(portfolioData)).not.toMatch(/HFMatch|SPLMatch|nimbus\.amgen/i);
  });

  it("keeps public contact and publication details", () => {
    expect(portfolioData.profile.email).toBe("varshithgopalakrishna@gmail.com");
    expect(portfolioData.profile.linkedin).toBe(
      "https://www.linkedin.com/in/varshithrgk/",
    );
    expect(portfolioData.profile.publication).toEqual({
      title: "Pharmacovigilance Made Easy",
      url: "https://notionpress.com/in/read/pharmacovigilance-made-easy",
      cover: "/assets/publication/pharmacovigilance-made-easy-cover.webp",
    });
  });

  it("uses optimized local WebP assets", () => {
    expect(portfolioData.profile.portrait).toBe(
      "/assets/portrait/krishna-portrait.webp",
    );
    expect(portfolioData.experience.filter((role) => role.logo)).toHaveLength(6);
    expect(
      portfolioData.experience
        .filter((role) => role.logo)
        .every((role) => role.logo?.endsWith(".webp")),
    ).toBe(true);
  });
});
