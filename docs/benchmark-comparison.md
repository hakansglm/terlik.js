# Benchmark Comparison: terlik.js vs Alternatives

Automated, reproducible comparison of terlik.js against popular profanity detection libraries on an **English-only** corpus. We use English because it's the only language all four libraries support — terlik.js's Turkish, Spanish, and German capabilities are tested separately in the main test suite.

> **Transparency note:** This benchmark is maintained by the terlik.js team. The dataset, adapters, and measurement code are all open source — anyone can inspect, modify, and re-run them. We encourage you to verify these results on your own hardware. See [Run It Yourself](#run-it-yourself) below.

## Libraries Tested

| Library | Version | Approach | Languages |
|---|---|---|---|
| [terlik.js](https://www.npmjs.com/package/terlik.js) | 2.4.1 | Multi-layer normalization + pattern engine + suffix system | TR, EN, ES, DE |
| [bad-words](https://www.npmjs.com/package/bad-words) | 3.0.4 | Simple word list with regex splitting | EN |
| [obscenity](https://www.npmjs.com/package/obscenity) | 0.4.6 | RegExp transformer pipeline | EN |
| [allprofanity](https://www.npmjs.com/package/allprofanity) | 2.2.1 | Aho-Corasick + Bloom filter | 9 languages (no Turkish) |

## Dataset

190 labeled English samples across 9 categories:

| Category | Count | Profane | Purpose |
|---|---|---|---|
| plain | 25 | yes | Direct profanity: "fuck you", "shit happens" |
| variant | 20 | yes | Morphological forms: "fucking", "motherfucker", "shitshow" |
| leet | 15 | yes | Character substitution: "f#ck", "sh1t", "$hit" |
| separator | 10 | yes | Inserted separators: "f.u.c.k", "s h i t" |
| repetition | 10 | yes | Repeated chars: "fuuuuck", "shiiiit" |
| combined | 10 | yes | Multiple evasions: "F.U.C.K.I.N.G", "$h!t" |
| clean | 40 | no | Normal sentences |
| whitelist | 50 | no | False positive traps: "assassin", "class", "scunthorpe", "cockburn" |
| edge_case | 10 | mixed | Empty strings, long input, embedded profanity, ALL CAPS |

The dataset is in [`benchmarks/comparison/dataset.ts`](../benchmarks/comparison/dataset.ts). PRs to improve it are welcome.

## Results

Measured on macOS (x64), Node.js v24.4.0. Results will vary by hardware — the relative ranking is what matters.

### 1. Accuracy

| Library | Precision | Recall | F1 | FPR | Accuracy |
|---|---|---|---|---|---|
| **terlik.js** | **98.8%** | **87.2%** | **92.7%** | 1.0% | **93.2%** |
| obscenity | 98.5% | 71.3% | 82.7% | 1.0% | 85.3% |
| bad-words | 100.0% | 51.1% | 67.6% | 0.0% | 75.8% |
| allprofanity | 100.0% | 40.4% | 57.6% | 0.0% | 70.5% |

**Metric definitions:**
- **Precision** — Of messages flagged as profane, how many actually were? (Higher = fewer false alarms)
- **Recall** — Of all profane messages, how many were caught? (Higher = fewer misses)
- **F1** — Harmonic mean of Precision and Recall. Single number for overall detection quality.
- **FPR** — False Positive Rate. How often clean messages get incorrectly flagged.

### Category Breakdown (detection rate)

| Category | terlik.js | bad-words | obscenity | allprofanity |
|---|---|---|---|---|
| plain | 84% | 96% | 76% | 64% |
| variant | 85% | 30% | 80% | 20% |
| leet | 87% | 60% | 93% | 60% |
| separator | 90% | 10% | 0% | 0% |
| repetition | 90% | 0% | 70% | 0% |
| combined | 90% | 40% | 70% | 50% |
| clean | 100% | 100% | 100% | 100% |
| whitelist | 98% | 100% | 98% | 100% |
| edge_case | 100% | 100% | 100% | 100% |

**Key takeaways:**
- **Separator evasion** ("f.u.c.k", "s h i t") — terlik.js: 90%, obscenity: 0%, bad-words: 10%, allprofanity: 0%
- **Repetition evasion** ("fuuuuck", "shiiiit") — terlik.js: 90%, obscenity: 70%, bad-words: 0%, allprofanity: 0%
- **Variant forms** ("motherfucker", "shitshow") — terlik.js: 85%, obscenity: 80%, bad-words: 30%, allprofanity: 20%
- All libraries scored 100% on clean sentences (no false positives on obviously clean text)
- terlik.js and obscenity each have 1 false positive on the whitelist set (terlik.js: "cocked", obscenity: "penistone")

### Where terlik.js misses (transparency)

terlik.js had 13 errors in this benchmark: 1 false positive and 12 false negatives.

**False positive (1):**
- "the cocked hat pub is historic" — `cock` substring not whitelisted for "cocked"

**False negatives (12):**
- Words not in the English dictionary: `hell`, `prick`, `screw` (deliberate narrow dictionary — these are context-dependent)
- Compound forms not in variants: `shitfaced`, `fuckery`
- Phonetic substitution: `phuck` (not in leet map)
- Repetition edge case: `helllll` (the root `hell` isn't in the dictionary)

These misses reflect terlik.js's **precision-over-recall** design philosophy. Words like "hell" and "screw" have legitimate uses and are excluded by default to avoid false positives. They can be added with `addWords()` or `customList` if your use case requires it.

### 2. Throughput

Operations per second (higher is better):

| Library | check() ops/sec | clean() ops/sec |
|---|---|---|
| **terlik.js** | **105,063** | **98,141** |
| obscenity | 64,064 | 47,327 |
| allprofanity | 45,831 | 45,760 |
| bad-words | 2,824 | 504 |

**Latency percentiles** (μs per batch of 100 messages):

| Library | check avg | check p95 | check p99 | clean avg | clean p95 | clean p99 |
|---|---|---|---|---|---|---|
| terlik.js | 951 | 1,089 | 1,259 | 1,018 | 1,178 | 1,373 |
| obscenity | 1,561 | 1,767 | 1,946 | 2,113 | 2,387 | 2,624 |
| allprofanity | 2,182 | 2,459 | 2,691 | 2,185 | 2,441 | 2,669 |
| bad-words | 35,409 | 38,559 | 40,747 | 198,588 | 212,769 | 215,753 |

terlik.js processes ~105K messages/sec for detection and ~98K for cleaning — **1.6x faster than obscenity**, **2.3x faster than allprofanity**, and **37x faster than bad-words** for detection.

### 3. Memory Usage

Heap delta in KB after initialization and after processing 2,000 messages:

| Library | Init Heap (KB) | Init RSS (KB) |
|---|---|---|
| terlik.js | +182 | +64 |
| obscenity | +185 | +60 |
| bad-words | +205 | +16 |
| allprofanity | varies | varies |

All libraries have similar initialization footprints (~180-200 KB heap). Memory measurements without `--expose-gc` are approximate — run with `node --expose-gc` for precise numbers.

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
- **Dataset bias.** The 190 samples were curated to test evasion techniques. A different dataset may produce different results.
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
