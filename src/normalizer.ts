// ─── Types ───────────────────────────────────────────

/** Configuration for creating a language-specific normalizer. */
export interface NormalizerConfig {
  locale: string;
  charMap: Record<string, string>;
  leetMap: Record<string, string>;
  numberExpansions?: [string, string][];
}

// ─── Universal Unicode normalization ─────────────────

/** Invisible/zero-width characters commonly used to bypass detection */
const INVISIBLE_CHARS =
  /[\u200B\u200C\u200D\u200E\u200F\uFEFF\u00AD\u034F\u2060\u2061\u2062\u2063\u2064\u180E]/g;

/** Combining diacritical marks (stripped after NFKD decomposition) */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/**
 * Cyrillic → Latin confusable map.
 * Only includes visually identical characters used for filter evasion.
 * Applied after toLowerCase so only lowercase mappings needed.
 */
const CYRILLIC_CONFUSABLES: Record<string, string> = {
  "\u0430": "a", // Cyrillic а → Latin a
  "\u0441": "c", // Cyrillic с → Latin c
  "\u0435": "e", // Cyrillic е → Latin e
  "\u0456": "i", // Cyrillic і → Latin i (Ukrainian)
  "\u043E": "o", // Cyrillic о → Latin o
  "\u0440": "p", // Cyrillic р → Latin p
  "\u0443": "u", // Cyrillic у → Latin u
  "\u0445": "x", // Cyrillic х → Latin x
};

// ─── Language-agnostic helpers ───────────────────────

function replaceFromMap(text: string, map: Record<string, string>): string {
  let result = "";
  for (const ch of text) {
    result += map[ch] ?? ch;
  }
  return result;
}

function buildNumberExpander(
  expansions: [string, string][],
): ((text: string) => string) | null {
  if (expansions.length === 0) return null;

  const regex = new RegExp(
    expansions
      .map(([num]) => {
        const escaped = num.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return `(?<=[a-zA-ZÀ-ɏ])${escaped}(?=[a-zA-ZÀ-ɏ])`;
      })
      .join("|"),
    "g",
  );
  const lookup: Record<string, string> = Object.fromEntries(expansions);

  return (text: string) =>
    text.replace(regex, (match) => lookup[match] ?? match);
}

function removePunctuation(text: string): string {
  return text.replace(/(?<=[a-zA-ZÀ-ɏ])[.\-_*,;:!?]+(?=[a-zA-ZÀ-ɏ])/g, "");
}

function collapseRepeats(text: string): string {
  return text.replace(/(.)\1{2,}/g, "$1");
}

function trimWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// ─── Factory: creates a normalize function for any language ───

/**
 * Creates a language-specific normalize function using the given config.
 * The returned function applies a 10-stage pipeline:
 *   1. Strip invisible chars (ZWSP, ZWNJ, soft hyphen, etc.)
 *   2. NFKD decompose (fullwidth → ASCII, precomposed → base + combining)
 *   3. Strip combining marks (removes accents/diacritics)
 *   4. Locale-aware lowercase
 *   5. Cyrillic confusable → Latin
 *   6. Language-specific char folding
 *   7. Number expansion
 *   8. Leet decode
 *   9. Punctuation removal
 *  10. Repeat collapse + whitespace trim
 *
 * @param config - Language-specific normalization settings.
 * @returns A normalize function for the configured language.
 *
 * @example
 * ```ts
 * const normalize = createNormalizer({
 *   locale: "de",
 *   charMap: { ä: "a", ö: "o", ü: "u", ß: "ss" },
 *   leetMap: { "0": "o", "3": "e" },
 * });
 * normalize("Scheiße"); // "scheisse"
 * normalize("fück");    // "fuck"
 * normalize("ｆｕｃｋ");  // "fuck"
 * ```
 */
export function createNormalizer(config: NormalizerConfig): (text: string) => string {
  const expandNumbers = config.numberExpansions
    ? buildNumberExpander(config.numberExpansions)
    : null;

  return function normalize(text: string): string {
    let result = text;
    // Universal: strip invisible chars, NFKD decompose, strip combining marks
    result = result.replace(INVISIBLE_CHARS, "");
    result = result.normalize("NFKD");
    result = result.replace(COMBINING_MARKS, "");
    // Locale-aware lowercase
    result = result.toLocaleLowerCase(config.locale);
    // Universal: Cyrillic confusable → Latin
    result = replaceFromMap(result, CYRILLIC_CONFUSABLES);
    // Language-specific char folding
    result = replaceFromMap(result, config.charMap);
    if (expandNumbers) {
      result = expandNumbers(result);
    }
    result = replaceFromMap(result, config.leetMap);
    result = removePunctuation(result);
    result = collapseRepeats(result);
    result = trimWhitespace(result);
    return result;
  };
}

// ─── Backward-compatible Turkish defaults ────────────
// Inline constants to avoid circular imports with lang/tr/config.ts

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "2": "i", "3": "e", "4": "a",
  "5": "s", "6": "g", "7": "t", "8": "b", "9": "g",
  "@": "a", $: "s", "!": "i",
};

const TR_NUMBER_MAP: [string, string][] = [
  ["100", "yuz"], ["50", "elli"], ["10", "on"], ["2", "iki"],
];

const _turkishNormalize = createNormalizer({
  locale: "tr",
  charMap: TURKISH_CHAR_MAP,
  leetMap: LEET_MAP,
  numberExpansions: TR_NUMBER_MAP,
});

/**
 * Normalizes text using the default Turkish locale pipeline.
 * Shorthand for `createNormalizer()` with Turkish defaults.
 *
 * @param text - The text to normalize.
 * @returns The normalized text.
 *
 * @example
 * ```ts
 * normalize("S.İ.K.T.İ.R"); // "siktir"
 * normalize("$1kt1r");       // "siktir"
 * ```
 */
export function normalize(text: string): string {
  return _turkishNormalize(text);
}

// ─── Individual exports for test backward compat ─────

function toLowercase(text: string): string {
  return text.toLocaleLowerCase("tr");
}

function replaceTurkishChars(text: string): string {
  return replaceFromMap(text, TURKISH_CHAR_MAP);
}

function replaceLeetspeak(text: string): string {
  return replaceFromMap(text, LEET_MAP);
}

function expandTurkishNumbers(text: string): string {
  const expander = buildNumberExpander(TR_NUMBER_MAP);
  return expander ? expander(text) : text;
}

export {
  toLowercase,
  replaceTurkishChars,
  replaceLeetspeak,
  expandTurkishNumbers,
  removePunctuation,
  collapseRepeats,
  trimWhitespace,
};
