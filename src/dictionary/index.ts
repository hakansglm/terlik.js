import type { WordEntry } from "../types.js";
import { TR_DICTIONARY, TR_WHITELIST } from "./tr.js";

export class Dictionary {
  private entries: Map<string, WordEntry> = new Map();
  private whitelist: Set<string>;
  private allWords: string[] = [];

  constructor(customWords?: string[], customWhitelist?: string[]) {
    this.whitelist = new Set(TR_WHITELIST.map((w) => w.toLowerCase()));

    if (customWhitelist) {
      for (const w of customWhitelist) {
        this.whitelist.add(w.toLowerCase());
      }
    }

    for (const entry of TR_DICTIONARY) {
      this.addEntry(entry);
    }

    if (customWords) {
      for (const word of customWords) {
        this.addEntry({
          root: word.toLowerCase(),
          variants: [],
          severity: "medium",
        });
      }
    }
  }

  private addEntry(entry: WordEntry): void {
    const normalizedRoot = entry.root.toLowerCase();
    this.entries.set(normalizedRoot, entry);
    this.allWords.push(normalizedRoot);
    for (const v of entry.variants) {
      this.allWords.push(v.toLowerCase());
    }
  }

  getEntries(): Map<string, WordEntry> {
    return this.entries;
  }

  getAllWords(): string[] {
    return this.allWords;
  }

  getWhitelist(): Set<string> {
    return this.whitelist;
  }

  addWords(words: string[]): void {
    for (const word of words) {
      if (!this.entries.has(word.toLowerCase())) {
        this.addEntry({
          root: word.toLowerCase(),
          variants: [],
          severity: "medium",
        });
      }
    }
  }

  removeWords(words: string[]): void {
    for (const word of words) {
      const key = word.toLowerCase();
      const entry = this.entries.get(key);
      if (entry) {
        this.entries.delete(key);
        this.allWords = this.allWords.filter(
          (w) => w !== key && !entry.variants.map((v) => v.toLowerCase()).includes(w),
        );
      }
    }
  }

  findRootForWord(word: string): WordEntry | undefined {
    const lower = word.toLowerCase();
    const direct = this.entries.get(lower);
    if (direct) return direct;

    for (const [, entry] of this.entries) {
      if (entry.variants.some((v) => v.toLowerCase() === lower)) {
        return entry;
      }
    }
    return undefined;
  }
}
