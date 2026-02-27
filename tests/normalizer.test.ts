import { describe, it, expect } from "vitest";
import {
  normalize,
  toLowercase,
  replaceTurkishChars,
  replaceLeetspeak,
  expandTurkishNumbers,
  removePunctuation,
  collapseRepeats,
  trimWhitespace,
} from "../src/normalizer.js";

describe("normalizer", () => {
  describe("toLowercase", () => {
    it("converts to lowercase with Turkish locale", () => {
      expect(toLowercase("HELLO")).toBe("hello");
      expect(toLowercase("İSTANBUL")).toBe("istanbul");
    });
  });

  describe("replaceTurkishChars", () => {
    it("replaces Turkish special characters", () => {
      expect(replaceTurkishChars("çğıöşü")).toBe("cgiosu");
      expect(replaceTurkishChars("ÇĞİÖŞÜ")).toBe("cgiosu");
    });

    it("preserves non-Turkish chars", () => {
      expect(replaceTurkishChars("hello")).toBe("hello");
    });
  });

  describe("replaceLeetspeak", () => {
    it("replaces common leet substitutions", () => {
      expect(replaceLeetspeak("h3ll0")).toBe("hello");
      expect(replaceLeetspeak("$1k")).toBe("sik");
      expect(replaceLeetspeak("4m1n4")).toBe("amina");
    });
  });

  describe("expandTurkishNumbers", () => {
    it("expands numbers between letters (harf+sayı+harf)", () => {
      expect(expandTurkishNumbers("s2k")).toBe("sikik");
      expect(expandTurkishNumbers("s2mle")).toBe("sikimle");
      expect(expandTurkishNumbers("a2b")).toBe("aikib");
    });

    it("does not expand standalone numbers", () => {
      expect(expandTurkishNumbers("2023 yilinda")).toBe("2023 yilinda");
      expect(expandTurkishNumbers("skor 2-1")).toBe("skor 2-1");
      expect(expandTurkishNumbers("100 kisi")).toBe("100 kisi");
    });

    it("does not expand single-sided numbers (leet handles those)", () => {
      expect(expandTurkishNumbers("8ok")).toBe("8ok");
      expect(expandTurkishNumbers("100les")).toBe("100les");
    });

    it("does not expand 6,8,9 (leet handles those as g,b,g)", () => {
      // i8ne → numExpand atlar (8 artık numExpand'de yok) → leet 8→b → ibne
      expect(expandTurkishNumbers("i8ne")).toBe("i8ne");
      expect(expandTurkishNumbers("6ot")).toBe("6ot");
    });

    it("handles mixed cases", () => {
      expect(expandTurkishNumbers("s2mle ugras")).toBe("sikimle ugras");
    });
  });

  describe("removePunctuation", () => {
    it("removes punctuation between letters", () => {
      expect(removePunctuation("s.i.k")).toBe("sik");
      expect(removePunctuation("s-i-k")).toBe("sik");
      expect(removePunctuation("s_i_k")).toBe("sik");
      expect(removePunctuation("s*i*k")).toBe("sik");
    });

    it("preserves punctuation at boundaries", () => {
      expect(removePunctuation("hello! world")).toBe("hello! world");
      expect(removePunctuation("test.")).toBe("test.");
    });
  });

  describe("collapseRepeats", () => {
    it("collapses 3+ repeated chars to 1", () => {
      expect(collapseRepeats("siiik")).toBe("sik");
      expect(collapseRepeats("ammmk")).toBe("amk");
      expect(collapseRepeats("aaaaaa")).toBe("a");
    });

    it("preserves 2 repeated chars", () => {
      expect(collapseRepeats("oo")).toBe("oo");
    });
  });

  describe("trimWhitespace", () => {
    it("collapses multiple spaces", () => {
      expect(trimWhitespace("  hello   world  ")).toBe("hello world");
    });
  });

  describe("normalize (full pipeline)", () => {
    it("handles combined transformations", () => {
      expect(normalize("S.İ.K.T.İ.R")).toBe("siktir");
      expect(normalize("$1k7!r")).toBe("siktir");
      expect(normalize("SIIIKTIR")).toBe("siktir");
      expect(normalize("  hello   world  ")).toBe("hello world");
    });

    it("handles empty/short input", () => {
      expect(normalize("")).toBe("");
      expect(normalize("a")).toBe("a");
    });

    it("preserves emojis", () => {
      const result = normalize("hello 😀 world");
      expect(result).toContain("😀");
    });
  });
});
