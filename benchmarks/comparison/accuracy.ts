import type { LibraryAdapter } from "./adapters.js";
import type { Sample } from "./dataset.js";

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface AccuracyResult {
  library: string;
  version: string;
  precision: number;
  recall: number;
  f1: number;
  fpr: number;
  accuracy: number;
  matrix: ConfusionMatrix;
  categoryBreakdown: Record<string, { correct: number; total: number; rate: number }>;
  errors: { text: string; expected: boolean; got: boolean; category: string }[];
}

export function runAccuracy(adapter: LibraryAdapter, samples: Sample[]): AccuracyResult {
  const matrix: ConfusionMatrix = { tp: 0, fp: 0, tn: 0, fn: 0 };
  const errors: AccuracyResult["errors"] = [];
  const catStats = new Map<string, { correct: number; total: number }>();

  for (const sample of samples) {
    let result: boolean;
    try {
      result = adapter.check(sample.text);
    } catch {
      result = false;
    }

    const correct = result === sample.profane;

    if (sample.profane && result) matrix.tp++;
    else if (sample.profane && !result) matrix.fn++;
    else if (!sample.profane && result) matrix.fp++;
    else matrix.tn++;

    if (!correct) {
      errors.push({
        text: sample.text.length > 60 ? sample.text.slice(0, 57) + "..." : sample.text,
        expected: sample.profane,
        got: result,
        category: sample.category,
      });
    }

    const cat = catStats.get(sample.category) ?? { correct: 0, total: 0 };
    cat.total++;
    if (correct) cat.correct++;
    catStats.set(sample.category, cat);
  }

  const precision = matrix.tp + matrix.fp > 0 ? matrix.tp / (matrix.tp + matrix.fp) : 0;
  const recall = matrix.tp + matrix.fn > 0 ? matrix.tp / (matrix.tp + matrix.fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const fpr = matrix.fp + matrix.tn > 0 ? matrix.fp / (matrix.fp + matrix.tn) : 0;
  const accuracy = (matrix.tp + matrix.tn) / samples.length;

  const categoryBreakdown: AccuracyResult["categoryBreakdown"] = {};
  for (const [cat, stats] of catStats) {
    categoryBreakdown[cat] = {
      ...stats,
      rate: stats.total > 0 ? stats.correct / stats.total : 0,
    };
  }

  return {
    library: adapter.name,
    version: adapter.version,
    precision,
    recall,
    f1,
    fpr,
    accuracy,
    matrix,
    categoryBreakdown,
    errors,
  };
}
