import { Terlik } from "../src/index.js";

const terlik = new Terlik();

const cleanMessages = [
  "merhaba dunya nasilsin",
  "bugun hava cok guzel",
  "istanbul guzel sehir",
  "yarin toplanti var",
  "kahvalti hazirliyorum",
];

const dirtyMessages = [
  "siktir git burdan",
  "bu adam aptal herif",
  "kes lan orospu cocugu",
  "ne boktan bir gun",
  "salak misin sen",
];

const suffixedDirtyMessages = [
  "siktiler hepsini",
  "sikerim seni",
  "orospuluk yapma",
  "gotune sokayim",
  "bokluklari bitmez",
  "ibnelik etme",
  "kahpeler toplandi",
  "serefsizler burda",
  "yavsaklik yapiyorsun",
  "aptallarin isi",
];

const mixedMessages = [...cleanMessages, ...dirtyMessages];

function bench(name: string, fn: () => void, iterations: number, msgsPerOp: number): void {
  // Warmup
  for (let i = 0; i < 100; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  const totalMsgs = iterations * msgsPerOp;
  const msgsPerSec = Math.round((totalMsgs / elapsed) * 1000);
  console.log(
    `${name}: ${elapsed.toFixed(2)}ms (${msgsPerSec.toLocaleString()} msgs/sec)`,
  );
}

console.log("=== terlik.js Benchmark ===\n");

console.log("--- containsProfanity ---");
bench("Clean messages", () => {
  for (const msg of cleanMessages) terlik.containsProfanity(msg);
}, 2_000, cleanMessages.length);

bench("Dirty messages", () => {
  for (const msg of dirtyMessages) terlik.containsProfanity(msg);
}, 2_000, dirtyMessages.length);

bench("Mixed messages", () => {
  for (const msg of mixedMessages) terlik.containsProfanity(msg);
}, 2_000, mixedMessages.length);

console.log("\n--- clean ---");
bench("Mixed clean()", () => {
  for (const msg of mixedMessages) terlik.clean(msg);
}, 2_000, mixedMessages.length);

console.log("\n--- getMatches ---");
bench("Mixed getMatches()", () => {
  for (const msg of mixedMessages) terlik.getMatches(msg);
}, 2_000, mixedMessages.length);

console.log("\n--- Suffixed dirty messages ---");
bench("Suffixed dirty", () => {
  for (const msg of suffixedDirtyMessages) terlik.containsProfanity(msg);
}, 2_000, suffixedDirtyMessages.length);

console.log("\n--- Modes comparison ---");
for (const mode of ["strict", "balanced", "loose"] as const) {
  const t = new Terlik({ mode });
  bench(`${mode} mode (mixed)`, () => {
    for (const msg of mixedMessages) t.containsProfanity(msg);
  }, 2_000, mixedMessages.length);
}

// ---------------------------------------------------------------------------
// Startup cost per language
// ---------------------------------------------------------------------------
console.log("\n--- Startup cost (constructor + JIT warmup) ---");
for (const lang of ["tr", "en", "es", "de"] as const) {
  const start = performance.now();
  const inst = new Terlik({ language: lang });
  const constructMs = performance.now() - start;

  const jitStart = performance.now();
  inst.containsProfanity("warmup string for JIT compilation test");
  const jitMs = performance.now() - jitStart;

  console.log(
    `${lang}: construct ${constructMs.toFixed(2)}ms, first-call JIT ${jitMs.toFixed(2)}ms, total ${(constructMs + jitMs).toFixed(2)}ms`,
  );
}

// ---------------------------------------------------------------------------
// Memory usage (4-language instances)
// ---------------------------------------------------------------------------
console.log("\n--- Memory usage (4-language instances) ---");
if (global.gc) global.gc();
const memBefore = process.memoryUsage();

const langInstances = new Map<string, Terlik>();
for (const lang of ["tr", "en", "es", "de"] as const) {
  const inst = new Terlik({ language: lang });
  inst.containsProfanity("warmup");
  langInstances.set(lang, inst);
}

const memAfter = process.memoryUsage();
const heapDelta = (memAfter.heapUsed - memBefore.heapUsed) / 1024;
const rssDelta = (memAfter.rss - memBefore.rss) / 1024;
console.log(
  `Heap delta: ${heapDelta > 0 ? "+" : ""}${heapDelta.toFixed(0)} KB, RSS delta: ${rssDelta > 0 ? "+" : ""}${rssDelta.toFixed(0)} KB`,
);

// ---------------------------------------------------------------------------
// Per-language throughput comparison
// ---------------------------------------------------------------------------
console.log("\n--- Per-language throughput (balanced mode, mixed input) ---");

const perLangInput: Record<string, string[]> = {
  tr: ["merhaba dunya", "siktir git", "bugun hava guzel", "orospu cocugu", "yarin toplanti"],
  en: ["hello world", "fuck you", "nice weather", "stupid bitch", "meeting tomorrow"],
  es: ["hola amigo", "hijo de puta", "buen dia", "pendejo idiota", "vamos al cine"],
  de: ["guten morgen", "fick dich", "schoenes wetter", "du arschloch", "treffen morgen"],
};

for (const [lang, msgs] of Object.entries(perLangInput)) {
  const inst = langInstances.get(lang) ?? new Terlik({ language: lang as "tr" | "en" | "es" | "de" });
  inst.containsProfanity("warmup");

  bench(`${lang} throughput`, () => {
    for (const msg of msgs) inst.containsProfanity(msg);
  }, 2_000, msgs.length);
}

// ---------------------------------------------------------------------------
// Input-size scaling
// ---------------------------------------------------------------------------
console.log("\n--- Input-size scaling (TR balanced, containsProfanity) ---");

const baseWord = "merhaba dunya nasilsin bugun hava guzel ";
const sizes = [10, 50, 200, 1000, 5000];

for (const size of sizes) {
  const input = baseWord.repeat(Math.ceil(size / baseWord.length)).slice(0, size);
  const iters = size <= 200 ? 2_000 : size <= 1000 ? 500 : 100;

  // Warmup
  for (let i = 0; i < 10; i++) terlik.containsProfanity(input);

  const start = performance.now();
  for (let i = 0; i < iters; i++) terlik.containsProfanity(input);
  const elapsed = performance.now() - start;

  const opsPerSec = Math.round((iters / elapsed) * 1000);
  console.log(
    `${String(size).padStart(5)} chars: ${elapsed.toFixed(2)}ms / ${iters} ops (${opsPerSec.toLocaleString()} ops/sec)`,
  );
}

console.log("\nDone.");
