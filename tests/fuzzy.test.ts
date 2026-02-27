import { describe, it, expect } from "vitest";
import {
  levenshteinDistance,
  levenshteinSimilarity,
  diceSimilarity,
  getFuzzyMatcher,
} from "../src/fuzzy.js";

describe("fuzzy", () => {
  describe("levenshteinDistance", () => {
    it("returns 0 for identical strings", () => {
      expect(levenshteinDistance("abc", "abc")).toBe(0);
    });

    it("returns correct distance for single edit", () => {
      expect(levenshteinDistance("abc", "ab")).toBe(1);
      expect(levenshteinDistance("abc", "axc")).toBe(1);
      expect(levenshteinDistance("abc", "abcd")).toBe(1);
    });

    it("handles empty strings", () => {
      expect(levenshteinDistance("", "abc")).toBe(3);
      expect(levenshteinDistance("abc", "")).toBe(3);
      expect(levenshteinDistance("", "")).toBe(0);
    });

    it("returns correct distance for multiple edits", () => {
      expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    });
  });

  describe("levenshteinSimilarity", () => {
    it("returns 1 for identical strings", () => {
      expect(levenshteinSimilarity("abc", "abc")).toBe(1);
    });

    it("returns 0 for completely different strings of same length", () => {
      expect(levenshteinSimilarity("abc", "xyz")).toBeCloseTo(0, 1);
    });

    it("returns value between 0 and 1", () => {
      const sim = levenshteinSimilarity("siktir", "siktr");
      expect(sim).toBeGreaterThan(0.5);
      expect(sim).toBeLessThan(1);
    });

    it("handles empty strings", () => {
      expect(levenshteinSimilarity("", "")).toBe(1);
    });
  });

  describe("diceSimilarity", () => {
    it("returns 1 for identical strings", () => {
      expect(diceSimilarity("abc", "abc")).toBe(1);
    });

    it("handles single-char strings", () => {
      expect(diceSimilarity("a", "a")).toBe(1);
      expect(diceSimilarity("a", "b")).toBe(0);
    });

    it("returns value between 0 and 1", () => {
      const sim = diceSimilarity("night", "nacht");
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThan(1);
    });

    it("returns 0 for no shared bigrams", () => {
      expect(diceSimilarity("ab", "cd")).toBe(0);
    });
  });

  describe("getFuzzyMatcher", () => {
    it("returns levenshtein matcher", () => {
      const matcher = getFuzzyMatcher("levenshtein");
      expect(matcher("abc", "abc")).toBe(1);
    });

    it("returns dice matcher", () => {
      const matcher = getFuzzyMatcher("dice");
      expect(matcher("abc", "abc")).toBe(1);
    });
  });
});
