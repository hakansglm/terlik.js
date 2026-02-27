import { describe, it, expect } from "vitest";
import { applyMask, cleanText } from "../src/cleaner.js";
import type { MatchResult } from "../src/types.js";

describe("cleaner", () => {
  describe("applyMask", () => {
    it("stars: replaces with asterisks matching length", () => {
      expect(applyMask("siktir", "stars", "[***]")).toBe("******");
    });

    it("partial: keeps first and last char", () => {
      expect(applyMask("siktir", "partial", "[***]")).toBe("s****r");
    });

    it("partial: handles short words", () => {
      expect(applyMask("am", "partial", "[***]")).toBe("**");
      expect(applyMask("a", "partial", "[***]")).toBe("*");
    });

    it("replace: uses custom mask", () => {
      expect(applyMask("siktir", "replace", "[***]")).toBe("[***]");
      expect(applyMask("siktir", "replace", "***")).toBe("***");
    });
  });

  describe("cleanText", () => {
    const matches: MatchResult[] = [
      {
        word: "siktir",
        root: "sik",
        index: 7,
        severity: "high",
        method: "pattern",
      },
    ];

    it("replaces matched words with stars", () => {
      const result = cleanText("haydi, siktir git!", matches, "stars", "[***]");
      expect(result).toBe("haydi, ****** git!");
    });

    it("replaces with partial mask", () => {
      const result = cleanText("haydi, siktir git!", matches, "partial", "[***]");
      expect(result).toBe("haydi, s****r git!");
    });

    it("replaces with custom mask", () => {
      const result = cleanText("haydi, siktir git!", matches, "replace", "[küfür]");
      expect(result).toBe("haydi, [küfür] git!");
    });

    it("handles multiple matches", () => {
      const multiMatches: MatchResult[] = [
        { word: "siktir", root: "sik", index: 0, severity: "high", method: "pattern" },
        { word: "aptal", root: "aptal", index: 11, severity: "low", method: "pattern" },
      ];
      const result = cleanText("siktir lan aptal", multiMatches, "stars", "[***]");
      expect(result).toBe("****** lan *****");
    });

    it("returns original text when no matches", () => {
      expect(cleanText("merhaba dunya", [], "stars", "[***]")).toBe("merhaba dunya");
    });
  });
});
