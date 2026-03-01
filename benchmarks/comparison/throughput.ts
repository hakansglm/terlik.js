import type { LibraryAdapter } from "./adapters.js";

export interface LatencyStats {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface ThroughputResult {
  library: string;
  version: string;
  check: { opsPerSec: number; latency: LatencyStats };
  clean: { opsPerSec: number; latency: LatencyStats };
}

const WARMUP_ITERATIONS = 100;
const MEASURE_ITERATIONS = 1000;

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function measureOp(
  fn: (text: string) => unknown,
  corpus: string[],
): { opsPerSec: number; latency: LatencyStats } {
  // warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    for (const text of corpus) fn(text);
  }

  const timings: number[] = [];
  const totalStart = performance.now();

  for (let i = 0; i < MEASURE_ITERATIONS; i++) {
    const iterStart = performance.now();
    for (const text of corpus) fn(text);
    timings.push((performance.now() - iterStart) * 1000); // μs
  }

  const totalElapsed = performance.now() - totalStart;
  const totalOps = MEASURE_ITERATIONS * corpus.length;
  const opsPerSec = Math.round((totalOps / totalElapsed) * 1000);

  timings.sort((a, b) => a - b);

  const latency: LatencyStats = {
    avg: Math.round(timings.reduce((s, t) => s + t, 0) / timings.length),
    p50: Math.round(percentile(timings, 50)),
    p95: Math.round(percentile(timings, 95)),
    p99: Math.round(percentile(timings, 99)),
  };

  return { opsPerSec, latency };
}

export function runThroughput(adapter: LibraryAdapter, corpus: string[]): ThroughputResult {
  const checkResult = measureOp((t) => adapter.check(t), corpus);
  const cleanResult = measureOp((t) => adapter.clean(t), corpus);

  return {
    library: adapter.name,
    version: adapter.version,
    check: checkResult,
    clean: cleanResult,
  };
}
