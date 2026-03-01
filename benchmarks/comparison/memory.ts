import type { LibraryAdapter } from "./adapters.js";

export interface MemoryResult {
  library: string;
  version: string;
  init: { heapKB: number; rssKB: number };
  load: { heapKB: number; rssKB: number };
}

function forceGC(): void {
  if (typeof global.gc === "function") {
    global.gc();
    global.gc();
  }
}

function getMemory(): { heap: number; rss: number } {
  const m = process.memoryUsage();
  return { heap: m.heapUsed, rss: m.rss };
}

export async function runMemory(
  createAdapter: () => LibraryAdapter,
  corpus: string[],
): Promise<MemoryResult> {
  // ── Init delta ──────────────────────────────────────────────────────
  forceGC();
  const beforeInit = getMemory();

  const adapter = createAdapter();
  await adapter.init();

  forceGC();
  const afterInit = getMemory();

  const initDelta = {
    heapKB: Math.round((afterInit.heap - beforeInit.heap) / 1024),
    rssKB: Math.round((afterInit.rss - beforeInit.rss) / 1024),
  };

  // ── Load delta (process 10K messages) ──────────────────────────────
  forceGC();
  const beforeLoad = getMemory();

  const iterations = Math.ceil(2_000 / corpus.length);
  for (let i = 0; i < iterations; i++) {
    for (const text of corpus) {
      adapter.check(text);
    }
  }

  forceGC();
  const afterLoad = getMemory();

  const loadDelta = {
    heapKB: Math.round((afterLoad.heap - beforeLoad.heap) / 1024),
    rssKB: Math.round((afterLoad.rss - beforeLoad.rss) / 1024),
  };

  return {
    library: adapter.name,
    version: adapter.version,
    init: initDelta,
    load: loadDelta,
  };
}
