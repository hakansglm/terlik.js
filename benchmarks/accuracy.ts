/**
 * Accuracy benchmark — Precision, Recall, F1, FPR, FNR per (language × mode).
 *
 * Usage:  pnpm bench:accuracy
 * Output: console table + benchmarks/accuracy-results.json
 * CI:     exits 1 if any balanced-mode F1 < 0.80
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Terlik } from "../src/index.js";
import { ALL_DATASETS, totalSamples, type Sample } from "./dataset.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

interface Metrics extends ConfusionMatrix {
  precision: number;
  recall: number;
  f1: number;
  fpr: number;
  fnr: number;
  accuracy: number;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}

interface Failure {
  text: string;
  expected: boolean;
  got: boolean;
  category: string;
  expectedRoot?: string;
  note?: string;
}

interface LangModeResult {
  lang: string;
  mode: string;
  samples: number;
  metrics: Metrics;
  categories: CategoryBreakdown[];
  failures: Failure[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeMetrics(cm: ConfusionMatrix): Metrics {
  const { tp, fp, tn, fn } = cm;
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const fpr = fp + tn === 0 ? 0 : fp / (fp + tn);
  const fnr = fn + tp === 0 ? 0 : fn / (fn + tp);
  const accuracy = tp + fp + tn + fn === 0 ? 1 : (tp + tn) / (tp + fp + tn + fn);
  return { tp, fp, tn, fn, precision, recall, f1, fpr, fnr, accuracy };
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function fixed(n: number, d = 4): string {
  return n.toFixed(d);
}

// ---------------------------------------------------------------------------
// Evaluate one (lang, mode) combination
// ---------------------------------------------------------------------------

function evaluate(lang: string, mode: "strict" | "balanced" | "loose", samples: Sample[]): LangModeResult {
  const terlik = new Terlik({ language: lang as "tr" | "en" | "es" | "de", mode });

  // warmup JIT
  terlik.containsProfanity("warmup test string");

  const cm: ConfusionMatrix = { tp: 0, fp: 0, tn: 0, fn: 0 };
  const failures: Failure[] = [];
  const categoryMap = new Map<string, { total: number; correct: number }>();

  for (const s of samples) {
    const predicted = terlik.containsProfanity(s.text);
    const correct = predicted === s.profane;

    // confusion matrix
    if (s.profane && predicted) cm.tp++;
    else if (!s.profane && predicted) cm.fp++;
    else if (!s.profane && !predicted) cm.tn++;
    else cm.fn++;

    // per-category
    const cat = categoryMap.get(s.category) ?? { total: 0, correct: 0 };
    cat.total++;
    if (correct) cat.correct++;
    categoryMap.set(s.category, cat);

    // failures
    if (!correct) {
      failures.push({
        text: s.text,
        expected: s.profane,
        got: predicted,
        category: s.category,
        expectedRoot: s.expectedRoot,
        note: s.note,
      });
    }
  }

  const categories: CategoryBreakdown[] = [...categoryMap.entries()]
    .map(([category, { total, correct }]) => ({
      category,
      total,
      correct,
      incorrect: total - correct,
      accuracy: total === 0 ? 1 : correct / total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // worst first

  return {
    lang,
    mode,
    samples: samples.length,
    metrics: computeMetrics(cm),
    categories,
    failures,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const MODES: ("strict" | "balanced" | "loose")[] = ["strict", "balanced", "loose"];
const results: LangModeResult[] = [];
let ciPass = true;

console.log(`\n=== terlik.js Accuracy Benchmark ===`);
console.log(`Total samples: ${totalSamples()}\n`);

for (const { lang, samples } of ALL_DATASETS) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${lang.toUpperCase()}  (${samples.length} samples)`);
  console.log(`${"=".repeat(60)}`);

  for (const mode of MODES) {
    const r = evaluate(lang, mode, samples);
    results.push(r);

    const m = r.metrics;
    console.log(`\n  [${mode}]`);
    console.log(`    Precision : ${pct(m.precision).padStart(7)}    Recall : ${pct(m.recall).padStart(7)}`);
    console.log(`    F1        : ${pct(m.f1).padStart(7)}    Acc    : ${pct(m.accuracy).padStart(7)}`);
    console.log(`    FPR       : ${pct(m.fpr).padStart(7)}    FNR    : ${pct(m.fnr).padStart(7)}`);
    console.log(`    TP=${m.tp}  FP=${m.fp}  TN=${m.tn}  FN=${m.fn}`);

    // CI gate: balanced F1 >= 0.80
    if (mode === "balanced" && m.f1 < 0.80) {
      console.log(`    *** FAIL: balanced F1 ${fixed(m.f1)} < 0.80 ***`);
      ciPass = false;
    }

    // Per-category breakdown (worst first, only show if there are failures)
    const bad = r.categories.filter((c) => c.incorrect > 0);
    if (bad.length > 0) {
      console.log(`\n    Category breakdown (worst first):`);
      for (const c of bad) {
        console.log(`      ${c.category.padEnd(16)} ${c.correct}/${c.total} (${pct(c.accuracy)})`);
      }
    }

    // Failures (max 10 per combo)
    if (r.failures.length > 0) {
      console.log(`\n    Failures (${r.failures.length}):`);
      for (const f of r.failures.slice(0, 10)) {
        const label = f.expected ? "FN" : "FP";
        const root = f.expectedRoot ? ` [${f.expectedRoot}]` : "";
        const note = f.note ? ` — ${f.note}` : "";
        console.log(`      ${label}: "${f.text}"${root} (${f.category})${note}`);
      }
      if (r.failures.length > 10) {
        console.log(`      ... and ${r.failures.length - 10} more`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Summary table
// ---------------------------------------------------------------------------

console.log(`\n\n${"=".repeat(60)}`);
console.log("  SUMMARY TABLE");
console.log(`${"=".repeat(60)}\n`);

const header = "Lang  Mode       Prec     Rec      F1       FPR      FNR      Acc";
const sep = "-".repeat(header.length);
console.log(header);
console.log(sep);

for (const r of results) {
  const m = r.metrics;
  console.log(
    `${r.lang.padEnd(6)}${r.mode.padEnd(11)}${pct(m.precision).padStart(7)}  ${pct(m.recall).padStart(7)}  ${pct(m.f1).padStart(7)}  ${pct(m.fpr).padStart(7)}  ${pct(m.fnr).padStart(7)}  ${pct(m.accuracy).padStart(7)}`
  );
}

console.log(sep);

// ---------------------------------------------------------------------------
// JSON output
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, "accuracy-results.json");

const jsonOutput = {
  timestamp: new Date().toISOString(),
  totalSamples: totalSamples(),
  results: results.map((r) => ({
    lang: r.lang,
    mode: r.mode,
    samples: r.samples,
    metrics: {
      precision: Number(fixed(r.metrics.precision)),
      recall: Number(fixed(r.metrics.recall)),
      f1: Number(fixed(r.metrics.f1)),
      fpr: Number(fixed(r.metrics.fpr)),
      fnr: Number(fixed(r.metrics.fnr)),
      accuracy: Number(fixed(r.metrics.accuracy)),
      tp: r.metrics.tp,
      fp: r.metrics.fp,
      tn: r.metrics.tn,
      fn: r.metrics.fn,
    },
    categories: r.categories,
    failureCount: r.failures.length,
    failures: r.failures,
  })),
};

writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2) + "\n");
console.log(`\nJSON output: ${jsonPath}`);

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------

if (!ciPass) {
  console.error("\n*** CI GATE FAILED: one or more balanced-mode F1 scores below 0.80 ***\n");
  process.exit(1);
}

console.log("\nAll balanced-mode F1 scores >= 0.80. Done.\n");
