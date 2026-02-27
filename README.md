# terlik.js

![terlik.js](git-header.png)

Production-grade Turkish profanity detection and filtering. Not a naive blacklist — a multi-layered normalization and pattern engine that catches what simple string matching misses.

Zero runtime dependencies. Full TypeScript. ESM + CJS.

## Why terlik.js?

Turkish profanity evasion is creative. Users write `s2k`, `$1kt1r`, `s.i.k.t.i.r`, `SİKTİR`, `siiiiiktir`, `i8ne`, `or*spu`, `pu$ttt`, `6öt` — and expect to get away with it.

terlik.js catches all of these. Here's what a single call handles:

```ts
import { Terlik } from "terlik.js";
const terlik = new Terlik();

terlik.clean("s2mle yüzle$ g0t_v3r3n o r o s p u pezev3nk i8ne pu$ttt or*spu");
// "***** yüzle$ ********* *********** ******** **** ****** ******"
// 7 matches, 0 false positives, <2ms
```

## Install

```bash
npm install terlik.js
# or
pnpm add terlik.js
# or
yarn add terlik.js
```

## Quick Start

```ts
import { Terlik } from "terlik.js";

const terlik = new Terlik();

// Detect
terlik.containsProfanity("siktir git");  // true
terlik.containsProfanity("merhaba");     // false

// Clean
terlik.clean("siktir git burdan");
// "****** git burdan"

// Inspect matches
terlik.getMatches("aptal orospu cocugu");
// [
//   { word: "aptal", root: "aptal", severity: "low", method: "pattern", index: 0 },
//   { word: "orospu cocugu", root: "orospu", severity: "high", method: "pattern", index: 6 }
// ]
```

## What It Catches

| Evasion technique | Example | Detected as |
|---|---|---|
| Plain text | `siktir` | sik |
| Turkish İ/I | `SİKTİR` | sik |
| Leet speak | `$1kt1r`, `@pt@l` | sik, aptal |
| Visual leet (TR) | `8ok`, `6öt`, `i8ne`, `s2k` | bok, göt, ibne, sik |
| Turkish number words | `s2mle` (s+iki+mle) | sik (sikimle) |
| Separators | `s.i.k.t.i.r`, `s_i_k` | sik |
| Spaces | `o r o s p u` | orospu |
| Char repetition | `siiiiiktir`, `pu$ttt` | sik, puşt |
| Mixed punctuation | `or*spu`, `g0t_v3r3n` | orospu, göt |
| Combined | `$1kt1r g0t_v3r3n` | both caught |

### What It Doesn't Catch (on purpose)

Whitelist prevents false positives on legitimate words:

```ts
terlik.containsProfanity("Amsterdam");    // false
terlik.containsProfanity("sikke");        // false (Ottoman coin)
terlik.containsProfanity("ambulans");     // false
terlik.containsProfanity("siklet");       // false (boxing weight class)
terlik.containsProfanity("memur");        // false
terlik.containsProfanity("malzeme");      // false
```

## How It Works

Six-stage normalization pipeline, then pattern matching:

```
input
  → lowercase (Turkish locale-aware)
  → Turkish char folding (İ→i, ç→c, ğ→g, ö→o, ş→s, ü→u)
  → Turkish number expansion (s2k → sikik, only between letters)
  → Leet speak decode (0→o, 1→i, 2→i, 8→b, 6→g, $→s, @→a, ...)
  → Punctuation removal (between letters: s.i.k → sik)
  → Repeat collapse (siiiiik → sik)
  → Pattern matching (dynamic regex with char class substitutions)
  → Whitelist filtering
  → Result
```

Pattern engine generates regex per root word with full substitution maps. For example, `sik` becomes a pattern that matches `s`, `$`, `5` for the first char, allows separators between chars, and so on.

## Performance

The `Terlik` constructor compiles regex patterns and builds lookup tables. **Create it once, reuse it everywhere.**

```ts
// Do this once at startup
const terlik = new Terlik();

// Then use it for every message — no per-call overhead
app.post("/chat", (req, res) => {
  const cleaned = terlik.clean(req.body.message); // <1ms typical
});
```

Benchmark results (Apple Silicon, single core, msgs/sec):

| Scenario | msgs/sec |
|---|---|
| Clean messages (no matches) | ~250,000 |
| Mixed messages (balanced mode) | ~188,000 |
| Strict mode | ~384,000 |
| Loose mode (with fuzzy) | ~11,000 |

> Tip: Avoid creating `new Terlik()` per request. Constructor cost is ~10ms (pattern compilation). A cached instance handles requests in microseconds.

## Options

```ts
const terlik = new Terlik({
  mode: "balanced",              // "strict" | "balanced" | "loose"
  maskStyle: "stars",            // "stars" | "partial" | "replace"
  replaceMask: "[***]",          // mask text for "replace" style
  customList: ["customword"],    // additional words to detect
  whitelist: ["safeword"],       // additional words to whitelist
  enableFuzzy: false,            // enable fuzzy matching
  fuzzyThreshold: 0.8,           // similarity threshold (0-1)
  fuzzyAlgorithm: "levenshtein", // "levenshtein" | "dice"
  maxLength: 10000,              // truncate input beyond this
});
```

## Detection Modes

| Mode | What it does | Best for |
|---|---|---|
| `strict` | Normalize + exact match only | Minimum false positives |
| `balanced` | Normalize + pattern matching with separator/leet tolerance | **General use (default)** |
| `loose` | Pattern + fuzzy matching (Levenshtein or Dice) | Maximum coverage, typo tolerance |

## API

### `terlik.containsProfanity(text, options?): boolean`

Quick boolean check. Runs full detection internally and returns `true` if any match exists.

### `terlik.getMatches(text, options?): MatchResult[]`

Returns all matches with details:

```ts
interface MatchResult {
  word: string;       // matched text from original input
  root: string;       // dictionary root word
  index: number;      // position in original text
  severity: "high" | "medium" | "low";
  method: "exact" | "pattern" | "fuzzy";
}
```

### `terlik.clean(text, options?): string`

Returns text with profanity masked. Three styles:

```ts
terlik.clean("siktir git");                                    // "****** git"
terlik.clean("siktir git", { maskStyle: "partial" });          // "s****r git"
terlik.clean("siktir git", { maskStyle: "replace" });          // "[***] git"
```

### `terlik.addWords(words) / removeWords(words)`

Runtime dictionary modification. Recompiles patterns automatically.

```ts
terlik.addWords(["customword"]);
terlik.containsProfanity("customword"); // true

terlik.removeWords(["salak"]);
terlik.containsProfanity("salak"); // false
```

### `normalize(text): string`

Standalone export. Useful if you need the normalization pipeline without detection.

```ts
import { normalize } from "terlik.js";

normalize("S.İ.K.T.İ.R"); // "siktir"
normalize("$1k7!r");       // "siktir"
normalize("s2mle");         // "sikimle"
```

## Testing

101 tests covering normalization, detection, fuzzy matching, cleaning, integration, and edge cases:

```bash
pnpm test          # run once
pnpm test:watch    # watch mode
```

### Live Test Server

An interactive browser-based test environment is included. Chat interface on the left, real-time process log on the right — see exactly what terlik.js does at each step (normalization, pattern matching, match details, timing).

```bash
pnpm dev:live      # http://localhost:2026
```

See [`live_test_server/README.md`](./live_test_server/README.md) for details.

## License

MIT
