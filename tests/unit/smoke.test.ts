import { describe, expect, it } from "vitest";
import { APP_TITLE } from "../../src/main";

describe("application shell", () => {
  it("exports the approved portfolio title", () => {
    expect(APP_TITLE).toBe("Krishna Varshith — Regulatory Systems World");
  });
});
