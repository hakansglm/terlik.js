export type Severity = "high" | "medium" | "low";
export type Mode = "strict" | "balanced" | "loose";
export type MaskStyle = "stars" | "partial" | "replace";
export type FuzzyAlgorithm = "levenshtein" | "dice";
export type MatchMethod = "exact" | "pattern" | "fuzzy";

export interface WordEntry {
  root: string;
  variants: string[];
  severity: Severity;
  category?: string;
  suffixable?: boolean;
}

export interface TerlikOptions {
  mode?: Mode;
  maskStyle?: MaskStyle;
  customList?: string[];
  whitelist?: string[];
  enableFuzzy?: boolean;
  fuzzyThreshold?: number;
  fuzzyAlgorithm?: FuzzyAlgorithm;
  disableNormalization?: boolean;
  maxLength?: number;
  replaceMask?: string;
}

export interface DetectOptions {
  mode?: Mode;
  enableFuzzy?: boolean;
  fuzzyThreshold?: number;
  fuzzyAlgorithm?: FuzzyAlgorithm;
}

export interface CleanOptions extends DetectOptions {
  maskStyle?: MaskStyle;
  replaceMask?: string;
}

export interface MatchResult {
  word: string;
  root: string;
  index: number;
  severity: Severity;
  method: MatchMethod;
}

export interface CompiledPattern {
  root: string;
  severity: Severity;
  regex: RegExp;
  variants: string[];
}
