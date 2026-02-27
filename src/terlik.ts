import type {
  CleanOptions,
  DetectOptions,
  MatchResult,
  MaskStyle,
  Mode,
  TerlikOptions,
} from "./types.js";
import { Dictionary } from "./dictionary/index.js";
import { Detector } from "./detector.js";
import { cleanText } from "./cleaner.js";
import { validateInput, MAX_INPUT_LENGTH } from "./utils.js";

export class Terlik {
  private dictionary: Dictionary;
  private detector: Detector;
  private mode: Mode;
  private maskStyle: MaskStyle;
  private enableFuzzy: boolean;
  private fuzzyThreshold: number;
  private fuzzyAlgorithm: "levenshtein" | "dice";
  private maxLength: number;
  private replaceMask: string;

  constructor(options?: TerlikOptions) {
    this.mode = options?.mode ?? "balanced";
    this.maskStyle = options?.maskStyle ?? "stars";
    this.enableFuzzy = options?.enableFuzzy ?? false;
    this.fuzzyThreshold = options?.fuzzyThreshold ?? 0.8;
    this.fuzzyAlgorithm = options?.fuzzyAlgorithm ?? "levenshtein";
    this.maxLength = options?.maxLength ?? MAX_INPUT_LENGTH;
    this.replaceMask = options?.replaceMask ?? "[***]";

    this.dictionary = new Dictionary(options?.customList, options?.whitelist);
    this.detector = new Detector(this.dictionary);
  }

  containsProfanity(text: string, options?: DetectOptions): boolean {
    const input = validateInput(text, this.maxLength);
    if (input.length === 0) return false;
    const matches = this.detector.detect(input, this.mergeDetectOptions(options));
    return matches.length > 0;
  }

  getMatches(text: string, options?: DetectOptions): MatchResult[] {
    const input = validateInput(text, this.maxLength);
    if (input.length === 0) return [];
    return this.detector.detect(input, this.mergeDetectOptions(options));
  }

  clean(text: string, options?: CleanOptions): string {
    const input = validateInput(text, this.maxLength);
    if (input.length === 0) return input;
    const matches = this.detector.detect(input, this.mergeDetectOptions(options));
    const style = options?.maskStyle ?? this.maskStyle;
    const replaceMask = options?.replaceMask ?? this.replaceMask;
    return cleanText(input, matches, style, replaceMask);
  }

  addWords(words: string[]): void {
    this.dictionary.addWords(words);
    this.detector.recompile();
  }

  removeWords(words: string[]): void {
    this.dictionary.removeWords(words);
    this.detector.recompile();
  }

  getPatterns(): Map<string, RegExp> {
    return this.detector.getPatterns();
  }

  private mergeDetectOptions(options?: DetectOptions): DetectOptions {
    return {
      mode: options?.mode ?? this.mode,
      enableFuzzy: options?.enableFuzzy ?? this.enableFuzzy,
      fuzzyThreshold: options?.fuzzyThreshold ?? this.fuzzyThreshold,
      fuzzyAlgorithm: options?.fuzzyAlgorithm ?? this.fuzzyAlgorithm,
    };
  }
}
