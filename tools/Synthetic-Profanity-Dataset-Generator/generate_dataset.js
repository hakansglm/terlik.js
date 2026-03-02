#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. mulberry32 — Deterministic PRNG
// ============================================================================
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// 2. CLI Argument Parser
// ============================================================================
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    lang: null,
    pos: 20000,
    neg: 20000,
    seed: 42,
    data: path.join(__dirname, 'data'),
    out: path.join(__dirname, 'output'),
    format: 'jsonl',
    stats: false,
    difficulty: 'all',
    validate: false,
    dryRun: false,
  };

  const langShortcuts = ['tr', 'en', 'es', 'de'];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--lang' && args[i + 1]) { opts.lang = args[++i]; }
    else if (arg === '--pos' && args[i + 1]) { opts.pos = parseInt(args[++i], 10); }
    else if (arg === '--neg' && args[i + 1]) { opts.neg = parseInt(args[++i], 10); }
    else if (arg === '--seed' && args[i + 1]) { opts.seed = parseInt(args[++i], 10); }
    else if (arg === '--data' && args[i + 1]) { opts.data = path.resolve(args[++i]); }
    else if (arg === '--out' && args[i + 1]) { opts.out = path.resolve(args[++i]); }
    else if (arg === '--format' && args[i + 1]) { opts.format = args[++i]; }
    else if (arg === '--difficulty' && args[i + 1]) { opts.difficulty = args[++i]; }
    else if (arg === '--stats') { opts.stats = true; }
    else if (arg === '--validate') { opts.validate = true; }
    else if (arg === '--dry-run') { opts.dryRun = true; }
    else {
      const shortcut = arg.replace(/^--/, '');
      if (langShortcuts.includes(shortcut)) { opts.lang = shortcut; }
    }
  }

  if (!opts.lang) {
    console.error('HATA: Dil belirtilmeli. Kullanim: --lang tr veya --tr');
    console.error('Desteklenen diller: tr, en, es, de');
    process.exit(1);
  }

  if (!langShortcuts.includes(opts.lang)) {
    console.error(`HATA: Desteklenmeyen dil: ${opts.lang}`);
    console.error('Desteklenen diller: tr, en, es, de');
    process.exit(1);
  }

  if (!['jsonl', 'csv', 'both'].includes(opts.format)) {
    console.error(`HATA: Gecersiz format: ${opts.format}. jsonl, csv veya both kullanin.`);
    process.exit(1);
  }

  return opts;
}

// ============================================================================
// 3. LANG_CONFIG — Only structural metadata, no words
// ============================================================================
const LANG_CONFIG = {
  tr: { name: 'Turkce', locale: 'tr', vowels: 'aeıioöuü' },
  en: { name: 'English', locale: 'en', vowels: 'aeiou' },
  es: { name: 'Espanol', locale: 'es', vowels: 'aeiou' },
  de: { name: 'Deutsch', locale: 'de', vowels: 'aeiouäöü' },
};

// ============================================================================
// 4. File Loaders
// ============================================================================
function parseUnicodeEscapes(str) {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function loadTextFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`UYARI: Dosya bulunamadi: ${filePath}`);
    return [];
  }
  return fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function loadMapFile(filePath) {
  const lines = loadTextFile(filePath);
  const map = {};
  for (const line of lines) {
    const match = line.match(/^(.+?)\s*->\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const vals = match[2].split(',').map(v => parseUnicodeEscapes(v.trim()));
      map[key] = vals;
    }
  }
  return map;
}

function loadUnicodeListFile(filePath) {
  const lines = loadTextFile(filePath);
  return lines.map(l => parseUnicodeEscapes(l));
}

// ============================================================================
// 5. loadAllData — Resolves language-specific + shared paths
// ============================================================================
function loadAllData(dataDir, lang) {
  const langDir = path.join(dataDir, lang);
  const sharedDir = path.join(dataDir, 'shared');

  const data = {
    rootsPositive: loadTextFile(path.join(langDir, 'roots_positive.txt')),
    rootsNegative: loadTextFile(path.join(langDir, 'roots_negative.txt')),
    templatesPositive: loadTextFile(path.join(langDir, 'templates_positive.txt')),
    templatesNegative: loadTextFile(path.join(langDir, 'templates_negative.txt')),
    contextsPositive: loadTextFile(path.join(langDir, 'contexts_positive.txt')),
    contextsNegative: loadTextFile(path.join(langDir, 'contexts_negative.txt')),
    suffixes: loadTextFile(path.join(langDir, 'suffixes.txt')),
    leetMap: loadMapFile(path.join(langDir, 'leet_map.txt')),
    emojiReplacements: loadTextFile(path.join(langDir, 'emoji_replacements.txt')),

    separators: loadTextFile(path.join(sharedDir, 'separators.txt')),
    unicodeMap: loadMapFile(path.join(sharedDir, 'unicode_map.txt')),
    zalgoChars: loadUnicodeListFile(path.join(sharedDir, 'zalgo_chars.txt')),
    zwcChars: loadUnicodeListFile(path.join(sharedDir, 'zwc_chars.txt')),
  };

  const missing = [];
  if (!data.rootsPositive.length) missing.push('roots_positive.txt');
  if (!data.rootsNegative.length) missing.push('roots_negative.txt');
  if (!data.templatesPositive.length) missing.push('templates_positive.txt');
  if (!data.templatesNegative.length) missing.push('templates_negative.txt');

  if (missing.length) {
    console.error(`HATA: Zorunlu dosyalar bos veya eksik [${lang}]: ${missing.join(', ')}`);
    process.exit(1);
  }

  return data;
}

// ============================================================================
// 6. Transform Functions (13 transforms)
// ============================================================================

// Family: morphological
function transformSuffix(word, data, rand) {
  if (!data.suffixes.length) return word;
  const suffix = data.suffixes[Math.floor(rand() * data.suffixes.length)];
  return word + suffix;
}

// Family: repetition
function transformCharRepeat(word, _data, rand) {
  if (word.length < 2) return word;
  const idx = Math.floor(rand() * word.length);
  const times = 2 + Math.floor(rand() * 3);
  return word.slice(0, idx) + word[idx].repeat(times) + word.slice(idx + 1);
}

// Family: substitution
function transformLeet(word, data, rand) {
  const { leetMap } = data;
  const keys = Object.keys(leetMap);
  if (!keys.length) return word;
  let result = '';
  for (const ch of word) {
    const lower = ch.toLowerCase();
    if (leetMap[lower] && rand() < 0.4) {
      const opts = leetMap[lower];
      result += opts[Math.floor(rand() * opts.length)];
    } else {
      result += ch;
    }
  }
  return result;
}

// Family: substitution
function transformUnicode(word, data, rand) {
  const { unicodeMap } = data;
  let result = '';
  for (const ch of word) {
    const lower = ch.toLowerCase();
    if (unicodeMap[lower] && rand() < 0.35) {
      const opts = unicodeMap[lower];
      result += opts[Math.floor(rand() * opts.length)];
    } else {
      result += ch;
    }
  }
  return result;
}

// Family: separator
function transformSeparator(word, data, rand) {
  if (!data.separators.length || word.length < 2) return word;
  const sep = data.separators[Math.floor(rand() * data.separators.length)];
  return word.split('').join(sep);
}

// Family: separator
function transformSplit(word, _data, rand) {
  if (word.length < 3) return word;
  const pos = 1 + Math.floor(rand() * (word.length - 1));
  return word.slice(0, pos) + ' ' + word.slice(pos);
}

// Family: casing
function transformCase(word, _data, rand) {
  const mode = rand();
  if (mode < 0.33) return word.toUpperCase();
  if (mode < 0.66) {
    return word.split('').map(c => rand() < 0.5 ? c.toUpperCase() : c.toLowerCase()).join('');
  }
  // alternating
  return word.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
}

// Family: obfuscation
function transformZalgo(word, data, rand) {
  if (!data.zalgoChars.length) return word;
  let result = '';
  for (const ch of word) {
    result += ch;
    const count = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < count; j++) {
      result += data.zalgoChars[Math.floor(rand() * data.zalgoChars.length)];
    }
  }
  return result;
}

// Family: obfuscation
function transformZwc(word, data, rand) {
  if (!data.zwcChars.length || word.length < 2) return word;
  let result = '';
  for (let i = 0; i < word.length; i++) {
    result += word[i];
    if (i < word.length - 1 && rand() < 0.5) {
      result += data.zwcChars[Math.floor(rand() * data.zwcChars.length)];
    }
  }
  return result;
}

// Family: substitution
function transformEmojiMix(word, data, rand) {
  if (!data.emojiReplacements.length || word.length < 2) return word;
  const emoji = data.emojiReplacements[Math.floor(rand() * data.emojiReplacements.length)];
  const pos = 1 + Math.floor(rand() * (word.length - 1));
  return word.slice(0, pos) + emoji + word.slice(pos);
}

// Family: morphological
function transformVowelDrop(word, _data, rand) {
  const langVowels = LANG_CONFIG[currentLang]?.vowels || 'aeiou';
  if (word.length < 3) return word;
  let result = '';
  let dropped = false;
  for (let i = 0; i < word.length; i++) {
    if (langVowels.includes(word[i].toLowerCase()) && i > 0 && i < word.length - 1 && rand() < 0.5) {
      dropped = true;
      continue;
    }
    result += word[i];
  }
  return dropped ? result : word;
}

// Family: morphological
function transformReverse(word, _data, _rand) {
  return word.split('').reverse().join('');
}

// Family: repetition
function transformDoubling(word, _data, rand) {
  if (word.length < 2) return word;
  const idx = Math.floor(rand() * word.length);
  return word.slice(0, idx + 1) + word[idx] + word.slice(idx + 1);
}

// Module-level state for currentLang (used by transformVowelDrop)
let currentLang = 'tr';

const TRANSFORMS = [
  { fn: transformSuffix, name: 'suffix', family: 'morphological' },
  { fn: transformCharRepeat, name: 'charRepeat', family: 'repetition' },
  { fn: transformLeet, name: 'leet', family: 'substitution' },
  { fn: transformUnicode, name: 'unicode', family: 'substitution' },
  { fn: transformSeparator, name: 'separator', family: 'separator' },
  { fn: transformSplit, name: 'split', family: 'separator' },
  { fn: transformCase, name: 'case', family: 'casing' },
  { fn: transformZalgo, name: 'zalgo', family: 'obfuscation' },
  { fn: transformZwc, name: 'zwc', family: 'obfuscation' },
  { fn: transformEmojiMix, name: 'emojiMix', family: 'substitution' },
  { fn: transformVowelDrop, name: 'vowelDrop', family: 'morphological' },
  { fn: transformReverse, name: 'reverse', family: 'morphological' },
  { fn: transformDoubling, name: 'doubling', family: 'repetition' },
];

// ============================================================================
// 7. Difficulty Assignment
// ============================================================================
const DIFFICULTY_WEIGHTS = { easy: 0.25, medium: 0.35, hard: 0.25, extreme: 0.15 };

const DIFFICULTY_TRANSFORMS = {
  easy: { min: 0, max: 1 },
  medium: { min: 1, max: 2 },
  hard: { min: 2, max: 3 },
  extreme: { min: 3, max: 5 },
};

function assignDifficulty(rand) {
  const r = rand();
  let cum = 0;
  for (const [diff, w] of Object.entries(DIFFICULTY_WEIGHTS)) {
    cum += w;
    if (r <= cum) return diff;
  }
  return 'medium';
}

function selectTransforms(difficulty, rand) {
  const { min, max } = DIFFICULTY_TRANSFORMS[difficulty];
  const count = min + Math.floor(rand() * (max - min + 1));
  if (count === 0) return [];

  const shuffled = [...TRANSFORMS].sort(() => rand() - 0.5);
  const selected = [];
  const familyCounts = {};

  for (const t of shuffled) {
    if (selected.length >= count) break;
    const fc = familyCounts[t.family] || 0;
    // Max 2 from same family; substitution family max 1 for non-extreme
    const familyMax = (t.family === 'substitution' && difficulty !== 'extreme') ? 1 : 2;
    if (fc < familyMax) {
      selected.push(t);
      familyCounts[t.family] = fc + 1;
    }
  }

  return selected;
}

// ============================================================================
// 8. renderExample — Template/context selection + transform pipeline
// ============================================================================
function renderPositiveExample(data, rand) {
  const root = data.rootsPositive[Math.floor(rand() * data.rootsPositive.length)];
  const difficulty = assignDifficulty(rand);
  const transforms = selectTransforms(difficulty, rand);

  let word = root;
  const appliedTransforms = [];

  for (const t of transforms) {
    const before = word;
    word = t.fn(word, data, rand);
    if (word !== before) {
      appliedTransforms.push(t.name);
    }
  }

  // Template (70%) vs Context (30%)
  let text;
  const useTemplate = rand() < 0.7;
  if (useTemplate && data.templatesPositive.length) {
    const tpl = data.templatesPositive[Math.floor(rand() * data.templatesPositive.length)];
    text = tpl.replace('{word}', word);
  } else if (data.contextsPositive.length) {
    const ctx = data.contextsPositive[Math.floor(rand() * data.contextsPositive.length)];
    text = ctx.replace('{word}', word);
  } else {
    text = word;
  }

  return {
    text: text.normalize('NFC'),
    label: 1,
    root,
    difficulty,
    transforms: appliedTransforms,
    category: 'positive',
  };
}

function renderNegativeExample(data, rand) {
  const root = data.rootsNegative[Math.floor(rand() * data.rootsNegative.length)];

  // Negative examples get no profanity transforms, but may get minor text variation
  const useTemplate = rand() < 0.7;
  let text;

  if (useTemplate && data.templatesNegative.length) {
    const tpl = data.templatesNegative[Math.floor(rand() * data.templatesNegative.length)];
    text = tpl.replace('{word}', root);
  } else if (data.contextsNegative.length) {
    const ctx = data.contextsNegative[Math.floor(rand() * data.contextsNegative.length)];
    text = ctx.replace('{word}', root);
  } else {
    text = root;
  }

  // Minor case variation for some negatives
  if (rand() < 0.15) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return {
    text: text.normalize('NFC'),
    label: 0,
    root,
    difficulty: 'clean',
    transforms: [],
    category: 'negative',
  };
}

// ============================================================================
// 9. Shuffle (Fisher-Yates with seeded PRNG)
// ============================================================================
function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================================================
// 10. Output Writers — Streaming JSONL / CSV
// ============================================================================
function writeJsonl(filePath, examples) {
  const ws = fs.createWriteStream(filePath, { encoding: 'utf-8' });
  for (const ex of examples) {
    ws.write(JSON.stringify(ex) + '\n');
  }
  ws.end();
  return new Promise((resolve, reject) => {
    ws.on('finish', resolve);
    ws.on('error', reject);
  });
}

function writeCsv(filePath, examples) {
  const ws = fs.createWriteStream(filePath, { encoding: 'utf-8' });
  ws.write('text,label,root,difficulty,transforms,category\n');
  for (const ex of examples) {
    const escapedText = '"' + ex.text.replace(/"/g, '""') + '"';
    const transforms = ex.transforms.join(';');
    ws.write(`${escapedText},${ex.label},${ex.root},${ex.difficulty},${transforms},${ex.category}\n`);
  }
  ws.end();
  return new Promise((resolve, reject) => {
    ws.on('finish', resolve);
    ws.on('error', reject);
  });
}

// ============================================================================
// 11. Stats Printer
// ============================================================================
function printStats(examples, lang) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ISTATISTIKLER — ${LANG_CONFIG[lang].name} (${lang})`);
  console.log('='.repeat(60));

  // Label distribution
  const labels = { positive: 0, negative: 0 };
  const difficulties = {};
  const transformCounts = {};
  const rootCounts = {};

  for (const ex of examples) {
    labels[ex.category]++;
    difficulties[ex.difficulty] = (difficulties[ex.difficulty] || 0) + 1;
    rootCounts[ex.root] = (rootCounts[ex.root] || 0) + 1;
    for (const t of ex.transforms) {
      transformCounts[t] = (transformCounts[t] || 0) + 1;
    }
  }

  console.log('\n  Etiket Dagilimi:');
  console.log(`    Pozitif (toxic):  ${labels.positive}`);
  console.log(`    Negatif (clean):  ${labels.negative}`);
  console.log(`    Toplam:           ${examples.length}`);

  console.log('\n  Zorluk Dagilimi:');
  for (const [diff, count] of Object.entries(difficulties).sort()) {
    const pct = ((count / examples.length) * 100).toFixed(1);
    console.log(`    ${diff.padEnd(10)} ${String(count).padStart(6)}  (${pct}%)`);
  }

  console.log('\n  Transform Kullanimi:');
  const sortedTransforms = Object.entries(transformCounts).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sortedTransforms) {
    console.log(`    ${name.padEnd(14)} ${String(count).padStart(6)}`);
  }

  console.log('\n  Kok Kelime Dagilimi (ilk 10):');
  const sortedRoots = Object.entries(rootCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [root, count] of sortedRoots) {
    console.log(`    ${root.padEnd(18)} ${String(count).padStart(6)}`);
  }

  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// 12. Validation
// ============================================================================
function validateExamples(examples, lang) {
  console.log('\n  DOGRULAMA SONUCLARI:');
  let errors = 0;

  // Duplicate check
  const texts = new Set();
  let duplicates = 0;
  for (const ex of examples) {
    if (texts.has(ex.text)) duplicates++;
    texts.add(ex.text);
  }
  if (duplicates > 0) {
    console.log(`    [UYARI] ${duplicates} tekrarlanan metin bulundu`);
  } else {
    console.log('    [OK] Tekrarlanan metin yok');
  }

  // Label sanity
  const posCount = examples.filter(e => e.label === 1).length;
  const negCount = examples.filter(e => e.label === 0).length;
  if (posCount === 0 || negCount === 0) {
    console.log('    [HATA] Tek etiketli veri seti');
    errors++;
  } else {
    console.log(`    [OK] Her iki etiket mevcut (pos: ${posCount}, neg: ${negCount})`);
  }

  // Balance check
  const ratio = posCount / (posCount + negCount);
  if (ratio < 0.3 || ratio > 0.7) {
    console.log(`    [UYARI] Dengesiz veri seti (pozitif oran: ${(ratio * 100).toFixed(1)}%)`);
  } else {
    console.log(`    [OK] Dengeli veri seti (pozitif oran: ${(ratio * 100).toFixed(1)}%)`);
  }

  // Encoding check
  let encodingErrors = 0;
  for (const ex of examples) {
    if (ex.text !== ex.text.normalize('NFC')) encodingErrors++;
  }
  if (encodingErrors > 0) {
    console.log(`    [UYARI] ${encodingErrors} ornek NFC normalizasyonunda degil`);
  } else {
    console.log('    [OK] Tum metinler NFC normalizasyonunda');
  }

  // Length check
  let emptyTexts = 0;
  let longTexts = 0;
  for (const ex of examples) {
    if (!ex.text || ex.text.trim().length === 0) emptyTexts++;
    if (ex.text.length > 500) longTexts++;
  }
  if (emptyTexts > 0) {
    console.log(`    [HATA] ${emptyTexts} bos metin bulundu`);
    errors++;
  } else {
    console.log('    [OK] Bos metin yok');
  }
  if (longTexts > 0) {
    console.log(`    [UYARI] ${longTexts} metin 500 karakterden uzun`);
  }

  // JSON parse check
  let parseErrors = 0;
  for (const ex of examples) {
    try {
      JSON.parse(JSON.stringify(ex));
    } catch {
      parseErrors++;
    }
  }
  if (parseErrors > 0) {
    console.log(`    [HATA] ${parseErrors} ornek JSON serialize edilemiyor`);
    errors++;
  } else {
    console.log('    [OK] Tum ornekler gecerli JSON');
  }

  return errors;
}

// ============================================================================
// 13. Sample Printer
// ============================================================================
function printSamples(examples, rand) {
  console.log('\n  ORNEK CIKTILAR:');
  const positives = examples.filter(e => e.label === 1);
  const negatives = examples.filter(e => e.label === 0);

  console.log('\n  --- Pozitif (toxic) ---');
  for (let i = 0; i < Math.min(5, positives.length); i++) {
    const idx = Math.floor(rand() * positives.length);
    const ex = positives[idx];
    console.log(`    [${ex.difficulty}] "${ex.text}" (root: ${ex.root}, transforms: ${ex.transforms.join(',')})`);
  }

  console.log('\n  --- Negatif (clean) ---');
  for (let i = 0; i < Math.min(5, negatives.length); i++) {
    const idx = Math.floor(rand() * negatives.length);
    const ex = negatives[idx];
    console.log(`    "${ex.text}" (root: ${ex.root})`);
  }
}

// ============================================================================
// 14. main() — Orchestration
// ============================================================================
async function main() {
  const opts = parseArgs(process.argv);
  const rand = mulberry32(opts.seed);
  currentLang = opts.lang;

  const langCfg = LANG_CONFIG[opts.lang];
  console.log(`\n  Synthetic Profanity Dataset Generator`);
  console.log(`  Dil: ${langCfg.name} (${opts.lang})`);
  console.log(`  Pozitif: ${opts.pos}, Negatif: ${opts.neg}`);
  console.log(`  Seed: ${opts.seed}, Format: ${opts.format}`);
  console.log(`  Zorluk: ${opts.difficulty}`);

  // Load data
  console.log('\n  Veri dosyalari yukleniyor...');
  const data = loadAllData(opts.data, opts.lang);
  console.log(`  Yuklenme tamamlandi:`);
  console.log(`    Pozitif kokler:     ${data.rootsPositive.length}`);
  console.log(`    Negatif kokler:     ${data.rootsNegative.length}`);
  console.log(`    Template (pos):     ${data.templatesPositive.length}`);
  console.log(`    Template (neg):     ${data.templatesNegative.length}`);
  console.log(`    Context (pos):      ${data.contextsPositive.length}`);
  console.log(`    Context (neg):      ${data.contextsNegative.length}`);
  console.log(`    Suffix:             ${data.suffixes.length}`);
  console.log(`    Leet map:           ${Object.keys(data.leetMap).length} harf`);
  console.log(`    Emoji:              ${data.emojiReplacements.length}`);
  console.log(`    Separators:         ${data.separators.length}`);
  console.log(`    Unicode map:        ${Object.keys(data.unicodeMap).length} harf`);
  console.log(`    Zalgo chars:        ${data.zalgoChars.length}`);
  console.log(`    ZWC chars:          ${data.zwcChars.length}`);

  if (opts.dryRun) {
    console.log('\n  [DRY-RUN] Veri dosyalari basariyla yuklendi. Uretim yapilmadi.');
    if (opts.stats) {
      // Generate small sample for stats preview
      const sampleExamples = [];
      for (let i = 0; i < 50; i++) sampleExamples.push(renderPositiveExample(data, rand));
      for (let i = 0; i < 50; i++) sampleExamples.push(renderNegativeExample(data, rand));
      printStats(sampleExamples, opts.lang);
      printSamples(sampleExamples, rand);
    }
    return;
  }

  // Generate examples
  console.log('\n  Ornekler uretiliyor...');
  const examples = [];
  const startTime = Date.now();

  for (let i = 0; i < opts.pos; i++) {
    const ex = renderPositiveExample(data, rand);
    if (opts.difficulty !== 'all' && ex.difficulty !== opts.difficulty) {
      // Re-roll if difficulty filter is active
      let retries = 10;
      let filtered = ex;
      while (filtered.difficulty !== opts.difficulty && retries > 0) {
        filtered = renderPositiveExample(data, rand);
        retries--;
      }
      examples.push(filtered);
    } else {
      examples.push(ex);
    }
  }

  for (let i = 0; i < opts.neg; i++) {
    examples.push(renderNegativeExample(data, rand));
  }

  const genTime = Date.now() - startTime;
  console.log(`  ${examples.length} ornek uretildi (${genTime}ms)`);

  // Shuffle
  shuffle(examples, rand);

  // Write output
  if (!fs.existsSync(opts.out)) {
    fs.mkdirSync(opts.out, { recursive: true });
  }

  const writePromises = [];

  if (opts.format === 'jsonl' || opts.format === 'both') {
    const jsonlPath = path.join(opts.out, `export-${opts.lang}.jsonl`);
    console.log(`  Yaziliyor: ${jsonlPath}`);
    writePromises.push(writeJsonl(jsonlPath, examples));
  }

  if (opts.format === 'csv' || opts.format === 'both') {
    const csvPath = path.join(opts.out, `export-${opts.lang}.csv`);
    console.log(`  Yaziliyor: ${csvPath}`);
    writePromises.push(writeCsv(csvPath, examples));
  }

  await Promise.all(writePromises);
  console.log('  Yazma tamamlandi.');

  // Stats
  if (opts.stats) {
    printStats(examples, opts.lang);
  }

  // Validation
  if (opts.validate) {
    const errors = validateExamples(examples, opts.lang);
    if (errors > 0) {
      console.log(`\n  [UYARI] ${errors} hata bulundu. Ciktiyi inceleyin.`);
    } else {
      console.log('\n  [OK] Tum dogrulama kontrolleri gecti.');
    }
  }

  // Samples
  printSamples(examples, rand);

  console.log('\n  Tamamlandi.');
}

main().catch(err => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
