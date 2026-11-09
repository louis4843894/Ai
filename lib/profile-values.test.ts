import { describe, expect, it } from "vitest";
import {
  getRegistrationDisplayName,
  normalizeDisplayName,
  normalizeEmail,
} from "./profile-values";

describe("profile value normalization", () => {
  it("trims surrounding whitespace from an email without changing its case", () => {
    expect(normalizeEmail("  User@Example.com \n")).toBe("User@Example.com");
  });

  it("trims a profile display name and preserves an empty value", () => {
    expect(normalizeDisplayName("  小明  ")).toBe("小明");
    expect(normalizeDisplayName("   ")).toBe("");
  });

  it("uses the existing default only when registration has no display name", () => {
    expect(getRegistrationDisplayName("  小明  ")).toBe("小明");
    expect(getRegistrationDisplayName("   ")).toBe("團購會員");
  });
});
