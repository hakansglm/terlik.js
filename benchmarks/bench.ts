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

console.log("\n--- Modes comparison ---");
for (const mode of ["strict", "balanced", "loose"] as const) {
  const t = new Terlik({ mode });
  bench(`${mode} mode (mixed)`, () => {
    for (const msg of mixedMessages) t.containsProfanity(msg);
  }, 2_000, mixedMessages.length);
}

console.log("\nDone.");
