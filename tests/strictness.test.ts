import { describe, it, expect } from "vitest";
import { Terlik } from "../src/terlik.js";

// ────────────────────────────────────────────────────────
//  Phase 4: Optional Strictness Toggles
// ────────────────────────────────────────────────────────

describe("disableLeetDecode", () => {
  it("default: leet decode active — catches $1kt1r", () => {
    const t = new Terlik();
    expect(t.containsProfanity("$1kt1r")).toBe(true);
  });

  it("constructor toggle: skips leet decode", () => {
    const t = new Terlik({ disableLeetDecode: true });
    // "$1kt1r" — without leet decode, digits stay as digits, no match
    expect(t.containsProfanity("$1kt1r")).toBe(false);
  });

  it("per-call override: disableLeetDecode on single call", () => {
    const t = new Terlik(); // default: leet active
    expect(t.containsProfanity("$1kt1r", { disableLeetDecode: true })).toBe(false);
    // Same instance, default call still works
    expect(t.containsProfanity("$1kt1r")).toBe(true);
  });

  it("safety layers stay active even with disableLeetDecode", () => {
    const t = new Terlik({ disableLeetDecode: true });
    // NFKD fullwidth: ｓｉｋｔｉｒ → siktir (stage 2)
    expect(t.containsProfanity("ｓｉｋｔｉｒ")).toBe(true);
    // Diacritics: sïktïr → siktir (stage 3)
    expect(t.containsProfanity("sïktïr")).toBe(true);
    // Cyrillic confusable: using Cyrillic 'а' and 'о' in "orospu"
    expect(t.containsProfanity("оrоspu")).toBe(true);
  });

  it("charClass pass 1 may still catch some visual substitutions", () => {
    const t = new Terlik({ disableLeetDecode: true });
    // Pattern charClasses (e.g. $ → s class) are part of regex, not normalizer.
    // "siktir" typed plainly should still be caught.
    expect(t.containsProfanity("siktir")).toBe(true);
  });

  it("plain profanity still detected with disableLeetDecode", () => {
    const t = new Terlik({ disableLeetDecode: true });
    expect(t.containsProfanity("amk")).toBe(true);
    expect(t.containsProfanity("orospu")).toBe(true);
  });
});

describe("disableCompound", () => {
  // "ShitPerson" is NOT an explicit variant in EN dict.
  // CamelCase split: "Shit Person" → "shit" detected.
  // Without split: "shitperson" is one token, no word boundary → no match.

  it("default: CamelCase decompounding active", () => {
    const t = new Terlik({ language: "en" });
    expect(t.containsProfanity("ShitPerson")).toBe(true);
  });

  it("constructor toggle: skips CamelCase decompounding", () => {
    const t = new Terlik({ language: "en", disableCompound: true });
    expect(t.containsProfanity("ShitPerson")).toBe(false);
  });

  it("per-call override: disable compound for one call", () => {
    const t = new Terlik({ language: "en" });
    expect(t.containsProfanity("ShitPerson", { disableCompound: true })).toBe(false);
    // Default call still catches it
    expect(t.containsProfanity("ShitPerson")).toBe(true);
  });

  it("explicit dictionary variants unaffected by disableCompound", () => {
    const t = new Terlik({ language: "en", disableCompound: true });
    // "motherfucker" and "fuckyou" are explicit variants, not relying on CamelCase
    expect(t.containsProfanity("motherfucker")).toBe(true);
    expect(t.containsProfanity("fuckyou")).toBe(true);
  });

  it("plain profanity still detected with disableCompound", () => {
    const t = new Terlik({ language: "en", disableCompound: true });
    expect(t.containsProfanity("fuck")).toBe(true);
    expect(t.containsProfanity("shit")).toBe(true);
  });
});

describe("minSeverity", () => {
  it("default: all severities detected", () => {
    const t = new Terlik();
    expect(t.containsProfanity("salak")).toBe(true);  // low
    expect(t.containsProfanity("bok")).toBe(true);     // medium
    expect(t.containsProfanity("siktir")).toBe(true);  // high
  });

  it("constructor: minSeverity=medium skips low", () => {
    const t = new Terlik({ minSeverity: "medium" });
    expect(t.containsProfanity("salak")).toBe(false);  // low → skipped
    expect(t.containsProfanity("bok")).toBe(true);     // medium → kept
    expect(t.containsProfanity("siktir")).toBe(true);  // high → kept
  });

  it("constructor: minSeverity=high skips low and medium", () => {
    const t = new Terlik({ minSeverity: "high" });
    expect(t.containsProfanity("salak")).toBe(false);  // low
    expect(t.containsProfanity("bok")).toBe(false);    // medium
    expect(t.containsProfanity("siktir")).toBe(true);  // high
  });

  it("per-call override: minSeverity on single call", () => {
    const t = new Terlik(); // default: no filter
    expect(t.containsProfanity("salak", { minSeverity: "medium" })).toBe(false);
    // Same instance, default call still returns low
    expect(t.containsProfanity("salak")).toBe(true);
  });

  it("minSeverity=low is equivalent to no filter", () => {
    const t = new Terlik({ minSeverity: "low" });
    expect(t.containsProfanity("salak")).toBe(true);   // low ≥ low
    expect(t.containsProfanity("bok")).toBe(true);
    expect(t.containsProfanity("siktir")).toBe(true);
  });
});

describe("excludeCategories", () => {
  it("default: all categories detected", () => {
    const t = new Terlik();
    expect(t.containsProfanity("siktir")).toBe(true);  // sexual
    expect(t.containsProfanity("orospu")).toBe(true);   // insult
    expect(t.containsProfanity("ibne")).toBe(true);     // slur
    expect(t.containsProfanity("bok")).toBe(true);      // general
  });

  it("constructor: exclude sexual category", () => {
    const t = new Terlik({ excludeCategories: ["sexual"] });
    expect(t.containsProfanity("siktir")).toBe(false);  // sexual → excluded
    expect(t.containsProfanity("orospu")).toBe(true);   // insult → kept
    expect(t.containsProfanity("bok")).toBe(true);      // general → kept
  });

  it("constructor: exclude multiple categories", () => {
    const t = new Terlik({ excludeCategories: ["sexual", "slur"] });
    expect(t.containsProfanity("siktir")).toBe(false);  // sexual
    expect(t.containsProfanity("ibne")).toBe(false);    // slur
    expect(t.containsProfanity("orospu")).toBe(true);   // insult
    expect(t.containsProfanity("bok")).toBe(true);      // general
  });

  it("per-call override: exclude categories for one call", () => {
    const t = new Terlik();
    expect(t.containsProfanity("siktir", { excludeCategories: ["sexual"] })).toBe(false);
    // Default call still catches it
    expect(t.containsProfanity("siktir")).toBe(true);
  });

  it("custom words (undefined category) never excluded", () => {
    const t = new Terlik({
      customList: ["badword"],
      excludeCategories: ["sexual", "insult", "slur", "general"],
    });
    // All built-in categories excluded, but custom word has no category → kept
    expect(t.containsProfanity("badword")).toBe(true);
  });
});

describe("category in MatchResult", () => {
  it("MatchResult includes category from dictionary", () => {
    const t = new Terlik();
    const matches = t.getMatches("siktir");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].category).toBe("sexual");
  });

  it("different categories in results", () => {
    const t = new Terlik();
    const matches = t.getMatches("orospu salak bok");
    const categories = matches.map((m) => m.category);
    expect(categories).toContain("insult");
    expect(categories).toContain("general");
  });

  it("custom words have undefined category", () => {
    const t = new Terlik({ customList: ["testword"] });
    const matches = t.getMatches("testword");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].category).toBeUndefined();
  });
});

describe("mode + toggle interaction", () => {
  it("mode=strict + minSeverity works together", () => {
    const t = new Terlik({ mode: "strict", minSeverity: "high" });
    // strict mode uses exact word match
    expect(t.containsProfanity("salak")).toBe(false); // low → filtered
    expect(t.containsProfanity("siktir")).toBe(true); // high → kept
  });

  it("mode=loose + excludeCategories works together", () => {
    const t = new Terlik({
      mode: "loose",
      enableFuzzy: true,
      excludeCategories: ["sexual"],
    });
    expect(t.containsProfanity("orospu")).toBe(true);  // insult → kept
    // sexual words excluded even in loose mode
    expect(t.containsProfanity("siktir")).toBe(false);
  });

  it("per-call mode override + constructor toggle", () => {
    const t = new Terlik({ minSeverity: "high" });
    // Constructor minSeverity persists even with per-call mode change
    expect(t.containsProfanity("salak", { mode: "strict" })).toBe(false);
    expect(t.containsProfanity("siktir", { mode: "strict" })).toBe(true);
  });

  it("per-call toggle overrides constructor default", () => {
    const t = new Terlik({ minSeverity: "high" });
    // Per-call removes the severity filter
    expect(t.containsProfanity("salak", { minSeverity: "low" })).toBe(true);
  });
});

describe("default behavior preservation", () => {
  it("no options = detect everything (backward compat)", () => {
    const t = new Terlik();
    expect(t.containsProfanity("siktir")).toBe(true);
    expect(t.containsProfanity("salak")).toBe(true);
    expect(t.containsProfanity("$1kt1r")).toBe(true);
    // CamelCase decompounding in TR
    const en = new Terlik({ language: "en" });
    expect(en.containsProfanity("ShitPerson")).toBe(true);
  });

  it("clean() respects toggles", () => {
    const t = new Terlik({ minSeverity: "high" });
    // "salak" (low) should NOT be masked
    expect(t.clean("salak")).toBe("salak");
    // "siktir" (high) should be masked
    expect(t.clean("siktir")).not.toBe("siktir");
  });

  it("clean() per-call override works", () => {
    const t = new Terlik();
    // Per-call: skip low severity in clean
    const cleaned = t.clean("salak siktir", { minSeverity: "high" });
    expect(cleaned).toContain("salak");
    expect(cleaned).not.toContain("siktir");
  });
});
