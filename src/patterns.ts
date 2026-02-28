import type { CompiledPattern, WordEntry } from "./types.js";
import { normalize } from "./normalizer.js";

const CHAR_CLASSES: Record<string, string> = {
  a: "[a4@àáâãäå]",
  b: "[b8ß]",
  c: "[cçÇ¢©]",
  d: "[d]",
  e: "[e3€èéêë]",
  f: "[f]",
  g: "[gğĞ69]",
  h: "[h#]",
  i: "[iıİ12!|ìíîï]",
  j: "[j]",
  k: "[k]",
  l: "[l1|]",
  m: "[m]",
  n: "[nñ]",
  o: "[o0öÖòóôõ]",
  p: "[p]",
  q: "[qk]",
  r: "[r]",
  s: "[s5$şŞß]",
  t: "[t7+]",
  u: "[uüÜùúûv]",
  v: "[vu]",
  w: "[w]",
  x: "[x]",
  y: "[y]",
  z: "[z2]",
};

// \W is NOT Unicode-aware — ı, ş, ğ etc. count as \W in JS.
// Use negated Unicode letter/number class instead to avoid eating Turkish chars.
const SEPARATOR = "[^\\p{L}\\p{N}]*";

const MAX_PATTERN_LENGTH = 5000;
const MAX_SUFFIX_CHAIN = 2;

function charToPattern(ch: string): string {
  const cls = CHAR_CLASSES[ch.toLowerCase()];
  if (cls) return `${cls}+`;
  // Escape regex special chars for unknown characters
  return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "+";
}

function wordToPattern(word: string): string {
  const normalized = normalize(word);
  const chars = [...normalized];
  const parts = chars.map(charToPattern);
  return parts.join(SEPARATOR);
}

function buildSuffixGroup(suffixes: string[]): string {
  if (suffixes.length === 0) return "";

  // Convert each suffix to a char-class pattern with separators between chars
  const suffixPatterns = suffixes.map((suffix) => {
    const chars = [...suffix];
    const parts = chars.map(charToPattern);
    return parts.join(SEPARATOR);
  });

  // Sort by length descending so longer suffixes match first
  suffixPatterns.sort((a, b) => b.length - a.length);

  // Join with alternation, allow separator between root and suffix (evasion protection)
  return `(?:${SEPARATOR}(?:${suffixPatterns.join("|")}))`;
}

export function compilePatterns(
  entries: Map<string, WordEntry>,
  suffixes?: string[],
): CompiledPattern[] {
  const patterns: CompiledPattern[] = [];

  // Build suffix group once, shared across all suffixable entries
  const suffixGroup = suffixes && suffixes.length > 0
    ? buildSuffixGroup(suffixes)
    : "";

  for (const [, entry] of entries) {
    const allForms = [entry.root, ...entry.variants];
    // Sort by length descending so longer variants match first
    const sortedForms = allForms
      .map((w) => normalize(w))
      .filter((w) => w.length > 0)
      // Remove duplicates
      .filter((w, i, arr) => arr.indexOf(w) === i)
      .sort((a, b) => b.length - a.length);

    const formPatterns = sortedForms.map(wordToPattern);
    const combined = formPatterns.join("|");

    // Determine if this entry gets suffix-aware boundary
    const useSuffix = entry.suffixable && suffixGroup.length > 0;

    let pattern: string;
    if (useSuffix) {
      // Suffix-aware: root + optional suffix chain (up to MAX_SUFFIX_CHAIN), then word boundary
      pattern = `(?<![\\p{L}\\p{N}])(?:${combined})${suffixGroup}{0,${MAX_SUFFIX_CHAIN}}(?![\\p{L}\\p{N}])`;
    } else {
      // Original: strict word boundary on both sides
      pattern = `(?<![\\p{L}\\p{N}])(?:${combined})(?![\\p{L}\\p{N}])`;
    }

    // Safety guard: if pattern is too long, fallback to non-suffix version
    if (pattern.length > MAX_PATTERN_LENGTH && useSuffix) {
      pattern = `(?<![\\p{L}\\p{N}])(?:${combined})(?![\\p{L}\\p{N}])`;
    }

    try {
      const regex = new RegExp(pattern, "giu");
      patterns.push({
        root: entry.root,
        severity: entry.severity,
        regex,
        variants: entry.variants,
      });
    } catch {
      // Fallback: try without suffix if suffix caused the error
      if (useSuffix) {
        try {
          const fallbackPattern = `(?<![\\p{L}\\p{N}])(?:${combined})(?![\\p{L}\\p{N}])`;
          const regex = new RegExp(fallbackPattern, "giu");
          patterns.push({
            root: entry.root,
            severity: entry.severity,
            regex,
            variants: entry.variants,
          });
        } catch {
          // Skip invalid patterns silently
        }
      }
    }
  }

  return patterns;
}
