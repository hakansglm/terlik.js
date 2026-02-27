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

const SEPARATOR = "[\\W_]*";

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

export function compilePatterns(entries: Map<string, WordEntry>): CompiledPattern[] {
  const patterns: CompiledPattern[] = [];

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
    const pattern = `(?<![\\p{L}\\p{N}])(?:${combined})(?![\\p{L}\\p{N}])`;

    try {
      const regex = new RegExp(pattern, "giu");
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

  return patterns;
}
