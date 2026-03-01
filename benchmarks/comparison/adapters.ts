import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export interface LibraryAdapter {
  name: string;
  version: string;
  init(): void | Promise<void>;
  check(text: string): boolean;
  clean(text: string): string;
}

// ─── terlik.js ───────────────────────────────────────────────────────

export function createTerlikAdapter(): LibraryAdapter {
  let instance: any;
  return {
    name: "terlik.js",
    version: "",
    init() {
      const { Terlik } = require("terlik.js");
      instance = new Terlik({ language: "en" });
      // warmup JIT
      instance.containsProfanity("warmup");
      instance.clean("warmup");
      try {
        this.version = require("terlik.js/package.json").version;
      } catch {
        this.version = "local";
      }
    },
    check(text: string): boolean {
      return instance.containsProfanity(text);
    },
    clean(text: string): string {
      return instance.clean(text);
    },
  };
}

// ─── bad-words ───────────────────────────────────────────────────────

export function createBadWordsAdapter(): LibraryAdapter {
  let filter: any;
  return {
    name: "bad-words",
    version: "",
    init() {
      const Filter = require("bad-words");
      filter = new Filter();
      // warmup
      filter.clean("warmup");
      try {
        this.version = require("bad-words/package.json").version;
      } catch {
        this.version = "?";
      }
    },
    check(text: string): boolean {
      if (typeof filter.isProfane === "function") {
        return filter.isProfane(text);
      }
      return filter.clean(text) !== text;
    },
    clean(text: string): string {
      return filter.clean(text);
    },
  };
}

// ─── obscenity ───────────────────────────────────────────────────────

export function createObscenityAdapter(): LibraryAdapter {
  let matcher: any;
  let censor: any;
  return {
    name: "obscenity",
    version: "",
    init() {
      const {
        RegExpMatcher,
        TextCensor,
        englishDataset,
        englishRecommendedTransformers,
      } = require("obscenity");
      matcher = new RegExpMatcher({
        ...englishDataset.build(),
        ...englishRecommendedTransformers,
      });
      censor = new TextCensor();
      // warmup
      matcher.hasMatch("warmup");
      try {
        this.version = require("obscenity/package.json").version;
      } catch {
        this.version = "?";
      }
    },
    check(text: string): boolean {
      return matcher.hasMatch(text);
    },
    clean(text: string): string {
      const matches = matcher.getAllMatches(text);
      return censor.applyTo(text, matches);
    },
  };
}

// ─── allprofanity ────────────────────────────────────────────────────

export function createAllProfanityAdapter(): LibraryAdapter {
  let profanity: any;
  return {
    name: "allprofanity",
    version: "",
    async init() {
      const mod = await import("allprofanity");
      const AllProfanity = mod.AllProfanity ?? (mod.default as any)?.constructor;
      if (AllProfanity && typeof AllProfanity === "function") {
        profanity = new AllProfanity();
      } else {
        profanity = mod.default ?? mod;
      }
      // ensure english is loaded
      if (typeof profanity.loadLanguages === "function") {
        profanity.loadLanguages(["english"]);
      } else if (typeof profanity.loadLanguage === "function") {
        profanity.loadLanguage("english");
      }
      // warmup
      profanity.check("warmup");
      try {
        this.version = require("allprofanity/package.json").version;
      } catch {
        this.version = "?";
      }
    },
    check(text: string): boolean {
      return profanity.check(text);
    },
    clean(text: string): string {
      return profanity.clean(text);
    },
  };
}

// ─── All adapters ────────────────────────────────────────────────────

export function createAllAdapters(): LibraryAdapter[] {
  return [
    createTerlikAdapter(),
    createBadWordsAdapter(),
    createObscenityAdapter(),
    createAllProfanityAdapter(),
  ];
}
