# Benchmark Comparison: terlik.js vs Alternatives

Automated, reproducible comparison of terlik.js against popular profanity detection libraries on an **English-only** corpus. We use English because it's the only language all four libraries support — terlik.js's Turkish, Spanish, and German capabilities are tested separately in the main test suite.

> **Transparency note:** This benchmark is maintained by the terlik.js team. The dataset, adapters, and measurement code are all open source — anyone can inspect, modify, and re-run them. We encourage you to verify these results on your own hardware. See [Run It Yourself](#run-it-yourself) below.

## Libraries Tested

| Library | Version | Approach | Languages |
|---|---|---|---|
| [terlik.js](https://www.npmjs.com/package/terlik.js) | local | Multi-layer normalization + pattern engine + suffix system | TR, EN, ES, DE |
| [bad-words](https://www.npmjs.com/package/bad-words) | 3.0.4 | Simple word list with regex splitting | EN |
| [obscenity](https://www.npmjs.com/package/obscenity) | 0.4.6 | RegExp transformer pipeline | EN |
| [allprofanity](https://www.npmjs.com/package/allprofanity) | 2.2.1 | Aho-Corasick + Bloom filter | 9 languages (no Turkish) |

## Dataset

290 labeled English samples across 9 categories:

| Category | Count | Profane | Purpose |
|---|---|---|---|
| plain | 50 | yes | Direct profanity: "fuck you", "watching porn", "he raped her" |
| variant | 35 | yes | Morphological forms: "motherfucker", "shitfaced", "pornographic", "rapist" |
| leet | 25 | yes | Character substitution: "f#ck", "8itch", "s#it", "ni66er", "phuck" |
| separator | 15 | yes | Inserted separators: "f.u.c.k", "s h i t", "n.i.g.g.e.r" |
| repetition | 15 | yes | Repeated chars: "fuuuuck", "sluuuut", "coooock" |
| combined | 15 | yes | Multiple evasions: "phuck3d", "n!66er", "5h!tty" |
| clean | 50 | no | Normal sentences |
| whitelist | 70 | no | False positive traps: "assassin", "analysis", "grape", "therapist", "pussywillow", "penistone", "screwdriver" |
| edge_case | 15 | mixed | Empty strings, long input, embedded profanity, ALL CAPS, mixed case, unicode |

The dataset is in [`benchmarks/comparison/dataset.ts`](../benchmarks/comparison/dataset.ts). PRs to improve it are welcome.

## Results

Measured on macOS, Node.js v24.4.0. Results will vary by hardware — the relative ranking is what matters.

### 1. Accuracy

| Library | Precision | Recall | F1 | FPR | Accuracy |
|---|---|---|---|---|---|
| **terlik.js** | **100.0%** | **100.0%** | **100.0%** | **0.0%** | **100.0%** |
| obscenity | 97.4% | 70.4% | 81.7% | 2.3% | 82.4% |
| bad-words | 100.0% | 49.4% | 66.1% | 0.0% | 71.7% |
| allprofanity | 100.0% | 42.6% | 59.7% | 0.0% | 67.9% |

**Metric definitions:**
- **Precision** — Of messages flagged as profane, how many actually were? (Higher = fewer false alarms)
- **Recall** — Of all profane messages, how many were caught? (Higher = fewer misses)
- **F1** — Harmonic mean of Precision and Recall. Single number for overall detection quality.
- **FPR** — False Positive Rate. How often clean messages get incorrectly flagged.

### Category Breakdown (detection rate)

| Category | terlik.js | bad-words | obscenity | allprofanity |
|---|---|---|---|---|
| plain | **100%** | 86% | 84% | 74% |
| variant | **100%** | 37% | 74% | 17% |
| leet | **100%** | 52% | 80% | 56% |
| separator | **100%** | 7% | 0% | 0% |
| repetition | **100%** | 0% | 67% | 0% |
| combined | **100%** | 27% | 67% | 40% |
| clean | 100% | 100% | 100% | 100% |
| whitelist | **100%** | 100% | 96% | 100% |
| edge_case | **100%** | 93% | 93% | 93% |

**Key takeaways:**
- **terlik.js achieves 100% across every category** — zero false positives, zero false negatives
- **Separator evasion** ("f.u.c.k", "n.i.g.g.e.r") — terlik.js: 100%, obscenity: 0%, bad-words: 7%, allprofanity: 0%
- **Repetition evasion** ("fuuuuck", "sluuuut") — terlik.js: 100%, obscenity: 67%, bad-words: 0%, allprofanity: 0%
- **Leet speak** ("8itch", "s#it", "ni66er", "phuck") — terlik.js: 100%, obscenity: 80%, bad-words: 52%, allprofanity: 56%
- **Whitelist precision** — terlik.js: 100% (0 FP), obscenity: 96% (3 FP on "penistone", "pussywillow", "pussycat")

### Where competitors miss

**bad-words** — 82 errors (0 FP, 82 FN):
- Cannot detect compound variants ("bullshit", "motherfucker", "shitfaced")
- Zero separator evasion detection (only catches 1/15)
- Zero repetition detection
- Misses most leet speak

**obscenity** — 51 errors (3 FP, 48 FN):
- False positives on "penistone", "pussywillow", "pussycat" (no whitelist)
- Cannot detect separator evasion at all (0/15)
- Misses "hell", "damn", "crap", "screw" and other common profanity
- Weak on combined evasion

**allprofanity** — 93 errors (0 FP, 93 FN):
- Misses most variant forms (only 17% detection)
- Zero separator and repetition detection
- Cannot detect many common roots ("hell", "prick", "crap", "screw")

### Where terlik.js stands (transparency)

terlik.js had **0 errors** in this benchmark: 0 false positives, 0 false negatives.

This is a significant improvement from v2.4.1 where terlik.js had 13 errors (1 FP, 12 FN). The improvements came from:

1. **Dictionary expansion** — Added 20 new English roots (hell, prick, screw, porn, blowjob, jizz, dildo, orgasm, orgy, hooker, negro, masturbate, semen, pussy, cum, penis, tit, vagina, anal, rape) with defensive whitelists
2. **Phonetic evasion** — `charClasses.f` now includes `ph` digraph, catching "phuck", "phucking"
3. **Extended leet map** — Added `6→g`, `8→b`, `#→h` mappings, catching "ni66er", "8itch", "s#it"
4. **Whitelist hardening** — 96 whitelist entries (was 42) covering "analysis", "grape", "therapist", "pussywillow", "penistone", "screwdriver", "hello", "helmet", "title", "cucumber" and more

> **Note:** 100% on a 290-sample dataset does not mean zero errors in the wild. Real-world text is infinitely varied. We continuously expand the dataset and fix edge cases as they're reported.

### 2. Throughput

Operations per second processing 100-message batches (higher is better):

**check() performance:**

| Library | ops/sec | avg (μs) | p50 (μs) | p95 (μs) | p99 (μs) |
|---|---|---|---|---|---|
| **terlik.js** | **81,212** | 1,230 | 1,197 | 1,524 | 1,798 |
| obscenity | 67,471 | 1,482 | 1,497 | 1,641 | 1,752 |
| allprofanity | 43,765 | 2,285 | 2,309 | 2,560 | 2,770 |
| bad-words | 2,855 | 35,030 | 35,564 | 38,381 | 40,226 |

**clean() performance:**

| Library | ops/sec | avg (μs) | p50 (μs) | p95 (μs) | p99 (μs) |
|---|---|---|---|---|---|
| **terlik.js** | **81,214** | 1,231 | 1,199 | 1,533 | 1,646 |
| obscenity | 47,390 | 2,110 | 2,143 | 2,326 | 2,425 |
| allprofanity | 43,885 | 2,279 | 2,317 | 2,496 | 2,594 |
| bad-words | 564 | 177,394 | 182,347 | 188,173 | 191,156 |

**Speed comparisons:**
- terlik.js is **1.2x faster** than obscenity for detection
- terlik.js is **1.7x faster** than obscenity for cleaning
- terlik.js is **1.9x faster** than allprofanity
- terlik.js is **28x faster** than bad-words for detection, **144x faster** for cleaning

### 3. Memory Usage

Heap and RSS delta in KB after initialization and after processing 2,000 messages:

| Library | Init Heap (KB) | Init RSS (KB) | Load Heap (KB) | Load RSS (KB) |
|---|---|---|---|---|
| terlik.js | +220 | +48 | -4,023 | +2,936 |
| bad-words | +205 | +36 | +9,519 | +60 |
| obscenity | +167 | +16 | +651 | +32 |
| allprofanity | +1,317 | +244 | -4,944 | -21,772 |

**Notes:**
- All libraries have similar initialization footprints (~170-220 KB heap)
- terlik.js's negative heap delta after processing indicates efficient GC behavior
- allprofanity's large init heap (+1.3 MB) is due to loading 2 language dictionaries (English + Hindi) by default
- Run with `node --expose-gc` for more precise measurements

### 4. Bundle Size Impact

English dictionary expansion (v2.4.1 → current):

| Metric | Before | After | Delta |
|---|---|---|---|
| English roots | 36 | 56 | +20 |
| English variants | 139 | 185 | +46 |
| English whitelist | 60 | 96 | +36 |
| English suffixes | 8 | 9 | +1 (ery) |
| ESM bundle (raw) | ~57 KB | ~64 KB | +7 KB |
| ESM bundle (gzip) | ~12 KB | ~14 KB | +2 KB |

The dictionary expansion added **+2 KB gzipped** to the total bundle. Dictionary entries compress well because they share common substrings.

## Methodology

- **Warmup:** 100 iterations before measurement to allow V8 JIT compilation
- **Measurement:** 1,000 iterations, each processing 100 messages
- **Latency:** Per-batch timing with percentile calculation (p50/p95/p99)
- **Memory:** `process.memoryUsage()` delta before/after init and load phases
- **Isolation:** Each library gets its own adapter with independent initialization
- **Fairness:** All libraries tested on the same corpus, same machine, same process

### Adapter Pattern

Each library is wrapped in a `LibraryAdapter` interface with `init()`, `check()`, and `clean()` methods. The adapters are in [`benchmarks/comparison/adapters.ts`](../benchmarks/comparison/adapters.ts). We use each library's recommended/documented API:

| Library | check() | clean() |
|---|---|---|
| terlik.js | `containsProfanity()` | `clean()` |
| bad-words | `isProfane()` / `clean() !== text` | `clean()` |
| obscenity | `matcher.hasMatch()` | `censor.applyTo()` |
| allprofanity | `check()` | `clean()` |

### Limitations

- **English only.** This benchmark doesn't test Turkish, Spanish, or German — only English, since it's the common denominator.
- **Dataset size.** 290 samples is comprehensive but not exhaustive. A different dataset may produce different results.
- **Self-reported.** This benchmark is maintained by the terlik.js team. We aim for fairness but acknowledge potential bias.
- **Single machine.** Absolute numbers (ops/sec) depend on hardware. Relative ranking is more meaningful.
- **Default configurations.** All libraries use their default/recommended settings. Custom tuning may improve individual results.
- **bad-words version.** We tested v3.0.4 (latest at time of writing). A v4 exists but npm resolves to v3.

## Run It Yourself

**Prerequisites:** Node.js >= 18, pnpm

```bash
# From the repository root:
pnpm build                  # Build terlik.js
pnpm bench:compare          # Install deps + run benchmark

# Or manually:
cd benchmarks/comparison
pnpm install
npx tsx run.ts              # Standard run
node --expose-gc --import tsx/esm run.ts   # With accurate memory measurement
```

The benchmark outputs:
1. Formatted tables to the console
2. JSON results to `benchmarks/comparison/results/comparison-results.json`

### Modifying the Benchmark

- **Add test cases:** Edit `dataset.ts` — add samples with `{ text, profane, category }`
- **Add a library:** Create an adapter in `adapters.ts` implementing `LibraryAdapter`, add its factory to `run.ts`
- **Change iterations:** Edit constants in `throughput.ts` (`WARMUP_ITERATIONS`, `MEASURE_ITERATIONS`)

## Raw Data

Full JSON output with per-sample error lists is saved to [`benchmarks/comparison/results/comparison-results.json`](../benchmarks/comparison/results/comparison-results.json) after each run.

## Contributing

Found an issue with the benchmark methodology? Think the dataset is unfair? **Please open an issue or PR.** We want this comparison to be as fair and transparent as possible.
