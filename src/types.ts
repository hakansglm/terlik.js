/** Profanity severity level. */
export type Severity = "high" | "medium" | "low";

/** Content category for profanity entries. */
export type Category = "sexual" | "insult" | "slur" | "general";

/** Numeric ordering for severity comparison. */
export const SEVERITY_ORDER: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/** Detection mode controlling the balance between precision and recall. */
export type Mode = "strict" | "balanced" | "loose";

/** Masking style used when cleaning text. */
export type MaskStyle = "stars" | "partial" | "replace";

/** Fuzzy matching algorithm. */
export type FuzzyAlgorithm = "levenshtein" | "dice";

/** How a match was detected. */
export type MatchMethod = "exact" | "pattern" | "fuzzy";

/** A single entry in the profanity dictionary. */
export interface WordEntry {
  /** The canonical root form of the word. */
  root: string;
  /** Alternative spellings or forms of the root. */
  variants: string[];
  /** Severity level of the word. */
  severity: Severity;
  /** Content category (e.g. "sexual", "insult", "slur", "general"). */
  category?: string;
  /** Whether the suffix engine should match grammatical suffixes on this root. */
  suffixable?: boolean;
}

/** Configuration options for creating a Terlik instance. */
export interface TerlikOptions {
  /** Language code (default: `"tr"`). */
  language?: string;
  /** Detection mode (default: `"balanced"`). */
  mode?: Mode;
  /** Masking style (default: `"stars"`). */
  maskStyle?: MaskStyle;
  /** Additional words to detect. */
  customList?: string[];
  /** Additional words to exclude from detection. */
  whitelist?: string[];
  /** Enable fuzzy matching (default: `false`). */
  enableFuzzy?: boolean;
  /** Fuzzy similarity threshold between 0 and 1 (default: `0.8`). */
  fuzzyThreshold?: number;
  /** Fuzzy matching algorithm (default: `"levenshtein"`). */
  fuzzyAlgorithm?: FuzzyAlgorithm;
  /** Maximum input length before truncation (default: `10000`). */
  maxLength?: number;
  /** Custom mask text for "replace" mask style (default: `"[***]"`). */
  replaceMask?: string;
  /** Background'da regex derleme + JIT warmup. Default: false. Serverless'da önerilmez. */
  backgroundWarmup?: boolean;
  /** External dictionary data to merge with the built-in language dictionary. */
  extendDictionary?: import("./dictionary/schema.js").DictionaryData;
  /** Disable leet-speak decoding and number expansion. See {@link DetectOptions.disableLeetDecode}. */
  disableLeetDecode?: boolean;
  /** Disable CamelCase decompounding. See {@link DetectOptions.disableCompound}. */
  disableCompound?: boolean;
  /** Minimum severity threshold. See {@link DetectOptions.minSeverity}. */
  minSeverity?: Severity;
  /** Categories to exclude. See {@link DetectOptions.excludeCategories}. */
  excludeCategories?: Category[];
}

/** Per-call detection options that override instance defaults. */
export interface DetectOptions {
  mode?: Mode;
  enableFuzzy?: boolean;
  fuzzyThreshold?: number;
  fuzzyAlgorithm?: FuzzyAlgorithm;
  /** Disable leet-speak decoding and number expansion in the normalization pass.
   *  Safety layers (NFKD, diacritics, Cyrillic confusables) remain active.
   *  Note: charClass-based pattern matching in pass 1 may still catch some
   *  visual substitutions (e.g. `$` for `s`). Default: `false`. */
  disableLeetDecode?: boolean;
  /** Disable CamelCase decompounding (3rd detection pass).
   *  Explicit compound variants in the dictionary (e.g. "motherfucker")
   *  are unaffected. Default: `false`. */
  disableCompound?: boolean;
  /** Minimum severity threshold. Matches below this level are excluded.
   *  Default: `undefined` (no filtering, equivalent to `"low"`). */
  minSeverity?: Severity;
  /** Categories to exclude from results. Matches with `undefined` category
   *  (e.g. custom words) are never excluded. Default: `undefined`. */
  excludeCategories?: Category[];
}

/** Per-call clean options that override instance defaults. */
export interface CleanOptions extends DetectOptions {
  maskStyle?: MaskStyle;
  replaceMask?: string;
}

/** A single profanity match found in the input text. */
export interface MatchResult {
  /** The matched text from the original input. */
  word: string;
  /** The dictionary root word. */
  root: string;
  /** Character index in the original input. */
  index: number;
  /** Severity of the matched word. */
  severity: Severity;
  /** Content category of the matched word (undefined for custom words). */
  category?: Category;
  /** How the match was detected. */
  method: MatchMethod;
}

/** A compiled regex pattern for a dictionary entry. */
export interface CompiledPattern {
  root: string;
  severity: Severity;
  category?: Category;
  regex: RegExp;
  variants: string[];
}
