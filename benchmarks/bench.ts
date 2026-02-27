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

const mixedMessages = [...cleanMessages, ...dirtyMessages];

function bench(name: string, fn: () => void, iterations: number): void {
  // Warmup
  for (let i = 0; i < 100; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  const opsPerSec = Math.round((iterations / elapsed) * 1000);
  console.log(
    `${name}: ${elapsed.toFixed(2)}ms for ${iterations} ops (${opsPerSec.toLocaleString()} ops/sec)`,
  );
}

console.log("=== terlik.js Benchmark ===\n");

console.log("--- containsProfanity ---");
bench("10k clean messages", () => {
  for (const msg of cleanMessages) terlik.containsProfanity(msg);
}, 2_000);

bench("10k dirty messages", () => {
  for (const msg of dirtyMessages) terlik.containsProfanity(msg);
}, 2_000);

bench("10k mixed messages", () => {
  for (const msg of mixedMessages) terlik.containsProfanity(msg);
}, 1_000);

console.log("\n--- clean ---");
bench("10k clean operations", () => {
  for (const msg of mixedMessages) terlik.clean(msg);
}, 1_000);

console.log("\n--- getMatches ---");
bench("10k getMatches", () => {
  for (const msg of mixedMessages) terlik.getMatches(msg);
}, 1_000);

console.log("\n--- 100k mixed containsProfanity ---");
bench("100k mixed messages", () => {
  for (const msg of mixedMessages) terlik.containsProfanity(msg);
}, 10_000);

console.log("\n--- Modes comparison (10k each) ---");
for (const mode of ["strict", "balanced", "loose"] as const) {
  const t = new Terlik({ mode });
  bench(`${mode} mode`, () => {
    for (const msg of mixedMessages) t.containsProfanity(msg);
  }, 1_000);
}

console.log("\nDone.");
