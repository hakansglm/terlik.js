import { Terlik, normalize } from "../src/index.js";

// Basic usage
const terlik = new Terlik();

console.log("=== Basic Detection ===");
console.log(terlik.containsProfanity("merhaba dunya")); // false
console.log(terlik.containsProfanity("siktir git")); // true

console.log("\n=== Cleaning ===");
console.log(terlik.clean("siktir git burdan")); // ****** git burdan

console.log("\n=== Match Details ===");
const matches = terlik.getMatches("bu adam aptal bir orospu cocugu");
for (const m of matches) {
  console.log(`  "${m.word}" (root: ${m.root}, severity: ${m.severity}, method: ${m.method})`);
}

console.log("\n=== Anti-evasion ===");
console.log(terlik.containsProfanity("s.i.k.t.i.r")); // true - separator evasion
console.log(terlik.containsProfanity("$1kt1r")); // true - leet speak
console.log(terlik.containsProfanity("siiiiiktir")); // true - char repetition
console.log(terlik.containsProfanity("SİKTİR")); // true - Turkish chars

console.log("\n=== Whitelist (false positive prevention) ===");
console.log(terlik.containsProfanity("sikke koleksiyonu")); // false
console.log(terlik.containsProfanity("amsterdam güzel")); // false
console.log(terlik.containsProfanity("ambulans geldi")); // false

console.log("\n=== Mask Styles ===");
const partial = new Terlik({ maskStyle: "partial" });
console.log(partial.clean("siktir git")); // s****r git

const replace = new Terlik({ maskStyle: "replace", replaceMask: "[***]" });
console.log(replace.clean("siktir git")); // [***] git

console.log("\n=== Custom Words ===");
const custom = new Terlik();
custom.addWords(["kodumun"]);
console.log(custom.containsProfanity("kodumun hayat")); // true

console.log("\n=== Standalone Normalize ===");
console.log(normalize("S.İ.K.T.İ.R")); // siktir
console.log(normalize("$1k7!r")); // siktir
