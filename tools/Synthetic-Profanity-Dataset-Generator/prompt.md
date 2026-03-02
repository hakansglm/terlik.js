# Synthetic Profanity Dataset Generator — Claude Code Prompt

> **Dil notu:** Bu prompt İngilizce yazılmıştır çünkü Claude Code ile çalışacaktır. Ancak script içi yorumlar, çıktı mesajları ve kullanıcıyla iletişim Türkçe olmalıdır.

---

## 1. Project Goal

Build a **Node.js CLI tool** (`generate_dataset.js`) that produces a large-scale synthetic profanity/toxicity dataset for training and evaluating Turkish-language content filters. The generator must be:

- **Fully file-driven**: Every data source (roots, templates, maps, suffixes, etc.) lives in its own `.txt` file — no hardcoded word lists in the code.
- **Deterministic**: Seeded PRNG (mulberry32) so the same seed always produces the same output.
- **Extensible**: Adding new roots, templates, or transforms is just editing a `.txt` file.
- **Rich in adversarial transforms**: Must defeat naive string-matching filters.

---

## 2. Directory Structure

```
project/
├── generate_dataset.js          # Main generator (single file, no build step)
├── package.json                 # Only dependency: none (pure Node.js)
├── data/
│   ├── roots_positive.txt       # Profane/toxic root words (one per line)
│   ├── roots_negative.txt       # Clean words & substring traps (one per line)
│   ├── templates_positive.txt   # Sentence templates containing profanity
│   ├── templates_negative.txt   # Clean sentence templates
│   ├── contexts_positive.txt    # Multi-sentence toxic contexts
│   ├── contexts_negative.txt    # Multi-sentence clean contexts
│   ├── suffixes.txt             # Turkish agglutinative suffixes
│   ├── separators.txt           # Characters used to split/obfuscate words
│   ├── leet_map.txt             # Leet-speak substitution map
│   ├── unicode_map.txt          # Homoglyph / confusable character map
│   ├── zalgo_chars.txt          # Combining diacritical marks for Zalgo text
│   ├── emoji_replacements.txt   # Emoji-based obfuscation patterns
│   └── zwc_chars.txt            # Zero-width characters for injection
├── output/
│   └── (generated files go here)
└── README.md
```

---

## 3. Data File Format Specification

All `.txt` files follow the same convention:

```
# This is a comment (lines starting with # are ignored)
# Blank lines are also ignored

actual_data_line_1
actual_data_line_2
```

### 3.1 `roots_positive.txt` — Profane Root Words

One root per line. These are the BASE forms before any transformation.

```
# === GENEL HAKARETLER ===
salak
aptal
gerizekalı
dangalak
mankafa
hıyar
gerzek
andaval
ahmak
budala
şapşal
# (ve daha fazlası...)

# === KÜFÜRLER ===
# (kendi listenle doldur)

# === IRKÇI / AYRIMCI ===
# (kendi listenle doldur)

# === CİNSEL İÇERİKLİ ===
# (kendi listenle doldur)

# === ARGO / SLANG ===
# (kendi listenle doldur)

# === KISALTMALAR ===
amk
sg
sus
stfu
```

**Best practice:**
- Organize with `# === CATEGORY ===` headers for readability
- Include abbreviated forms (amk, sg, stfu) as separate roots
- Include common misspellings people use intentionally
- Keep roots in lowercase; the generator handles casing

### 3.2 `roots_negative.txt` — Clean Words & Traps

These generate label=0 examples. Include words that are tricky because they contain profane substrings.

```
# === SUBSTRING TRAPS ===
# Words that contain profane substrings but are clean
analiz
analyst
malatya
therapist
classic
assignment
cocukluk
ameliyat
aşık

# === COMMON CLEAN WORDS ===
merhaba
teşekkürler
toplantı
rapor
bugün
günaydın

# === FORMAL / ACADEMIC ===
araştırma
değerlendirme
istatistik
```

### 3.3 `templates_positive.txt` — Toxic Sentence Templates

Use `{W}` as the placeholder for the transformed word. Use `{W2}` for a second word if needed.

```
# === DIRECT INSULT ===
Sen {W} mısın?
{W} herif
Hadi ordan {W}
{W} gibi davranma
Ne {W} adamsın ya
Bu ne {W} bir hareket

# === CHAT / SOCIAL MEDIA STYLE ===
{W}!!!!
ya {W} ya
lan {W}
{W} olm
{W} be
ahahah {W}
{W} LMAOOOO
{W} 😂😂😂

# === MULTI-WORD / COMBO ===
{W} {W2} seni
Sen tam bir {W}
Böyle {W} bir şey görmedim
{W} gibi konuşma

# === SUBTLE / INDIRECT ===
Bu kadar {W} olmak zor
{W} olduğunu herkes biliyor
Biraz daha {W} ol bence
Klasik {W} hareketi

# === THREAT / AGGRESSION ===
Seni {W}
{W} seni gidi {W}
Bir daha yapma {W}
```

**Best practice:**
- Include emoji-heavy social media patterns
- Include multi-word combos with `{W2}`
- Include subtle/indirect patterns (harder to detect)
- Include mixed Turkish-English patterns
- At least 50+ templates recommended

### 3.4 `templates_negative.txt` — Clean Sentence Templates

```
# === FORMAL ===
Bugün {W} konusunu ele alacağız.
{W} raporunu hazırladım.
Toplantıda {W} hakkında konuştuk.
Lütfen {W} dosyasını inceleyin.

# === CASUAL CHAT ===
{W} nasıl gidiyor?
{W} hakkında ne düşünüyorsun?
Dün {W} gördüm çok güzeldi.

# === EDUCATIONAL ===
{W} kelimesinin kökeni şudur:
Bu makalede {W} analiz edilmektedir.
{W} kavramı ilk olarak 1920'de ortaya çıkmıştır.

# === QUOTING / MENTION CONTEXT ===
"{W}" kelimesi sözlükte şu anlama gelir.
Kullanıcı "{W}" yazmış, bu kurallara aykırı mı?
Filtre "{W}" kelimesini yakalıyor mu test edelim.
```

### 3.5 `contexts_positive.txt` — Multi-Sentence Toxic Contexts

Each entry is separated by `---` on its own line. `{W}` is the placeholder.

```
# Multi-sentence contexts where profanity appears in longer text
Bu adam tam bir {W}. Daha ne kadar sabredeceğiz?
---
Ya arkadaş sen {W} mısın nesin? Anlatsam anlamayacaksın.
---
Bak {W} gibi konuşma benimle. Ciddi söylüyorum.
---
# Sarcasm / irony
Çok zekisin ya, tam bir {W} değilsin kesinlikle 🙄
---
# Passive aggressive
Yani {W} demiyorum ama durumun tam olarak o.
```

### 3.6 `contexts_negative.txt` — Multi-Sentence Clean Contexts

```
Bu konuda bir analiz yapmamız gerekiyor. Raporu yarına hazırlarız.
---
Toplantı saat 3'te. Herkes hazır olsun lütfen.
---
Malatya'dan gelen siparişler gecikmeli gelecek. Müşteriyi bilgilendirelim.
```

### 3.7 `suffixes.txt` — Turkish Suffixes

```
# Boş ek (hiç ek eklenmez)

# Çoğul
lar
ler

# İsimden isim
lık
lik
luk
lük

# Meslek / kişi
cı
ci
cu
cü

# Benzerlik
msı
msi

# Soru
mı
mi
mu
mü

# Kişi eki
sın
sin
sun
sün

# Zarf
ca
ce
```

### 3.8 `separators.txt`

One character/string per line.

```
# Whitespace & punctuation
 
.
_
-
,

# Special
·
•
|
/
\

# Emoji separators
🤡
💩
🔥
⭐
```

### 3.9 `leet_map.txt`

Format: `source_char=replacement1,replacement2,...`

```
a=@,4,α,^
e=3,€,ε
i=1,!,|,ı
o=0,(),ø
s=$,5,§
t=7,+,†
g=9,6,ğ
u=ü,µ,v
c=ç,(,<
k=|<,|{
```

### 3.10 `unicode_map.txt`

Format: `source_char=confusable1,confusable2,...`

```
# Latin → Cyrillic / Greek / other lookalikes
a=а,ɑ,α
e=е,ё,ε
o=о,ο,σ
i=і,ι,ɪ
c=с,ϲ
s=ѕ,ꜱ
p=р,ρ
k=κ,к
l=ⅼ,ℓ,ɭ
```

### 3.11 `zalgo_chars.txt`

One Unicode combining character per line (use the actual character or \uXXXX notation).

```
\u0300
\u0301
\u0302
\u0303
\u0304
\u0305
\u0306
\u0307
\u0308
\u030A
\u030B
\u030C
\u0327
\u0328
\u0330
\u0331
\u0340
\u0341
```

### 3.12 `emoji_replacements.txt`

Format: `word_or_concept=emoji_sequence`

```
# Emoji that can replace or reinforce insults
aptal=🤡,🧠❌,💩
salak=🤪,🐒,🤡
bok=💩,🟤
siktir=🖕,🖕🏻
ölüm=💀,☠️,⚰️
```

### 3.13 `zwc_chars.txt` — Zero-Width Characters

```
\u200B
\u200C
\u200D
\uFEFF
\u00AD
\u2060
\u180E
```

---

## 4. Generator Architecture

### 4.1 CLI Interface

```bash
node generate_dataset.js \
  --pos 25000 \
  --neg 25000 \
  --seed 42 \
  --data ./data \
  --out ./output \
  --format jsonl \
  --stats
```

| Flag | Default | Description |
|------|---------|-------------|
| `--pos` | 20000 | Number of positive (toxic) examples |
| `--neg` | 20000 | Number of negative (clean) examples |
| `--seed` | 42 | PRNG seed for reproducibility |
| `--data` | `./data` | Path to data directory containing .txt files |
| `--out` | `./output` | Output directory |
| `--format` | `jsonl` | Output format: `jsonl`, `csv`, or `both` |
| `--stats` | false | Print distribution statistics after generation |
| `--difficulty` | `all` | Filter: `easy`, `medium`, `hard`, `extreme`, `all` |
| `--validate` | false | Run validation checks on generated data |

### 4.2 File Loading

```javascript
function loadTextFile(filePath) {
  // 1. Read file as UTF-8
  // 2. Split by newline
  // 3. Trim each line
  // 4. Filter out empty lines and lines starting with #
  // 5. Return array of strings
  // 6. Throw descriptive error if file not found
}

function loadMapFile(filePath) {
  // Parse "key=val1,val2,val3" format
  // Return Map<string, string[]>
}

function loadContextFile(filePath) {
  // Split by "---" separator
  // Each block is one context entry
  // Return array of strings (each may contain {W})
}
```

### 4.3 Adversarial Transform Pipeline

The transform pipeline is the core of the generator. Each example goes through a **difficulty-based subset** of these transforms:

```
┌─────────────────────────────────────────────────────────┐
│                  TRANSFORM PIPELINE                      │
│                                                          │
│  Input: root word (e.g., "salak")                       │
│                                                          │
│  ┌──────────────┐                                       │
│  │ 1. Suffix    │  Turkish agglutination (salaklar)     │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 2. CharRepeat│  Stretch chars (saaalaaak)            │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 3. Leet      │  l33t speak (s@l@k, 5alak)           │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 4. Unicode   │  Homoglyphs (sаlаk with Cyrillic а)  │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 5. Separator │  Insert chars (s.a.l.a.k, s_a_l_a_k) │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 6. Split     │  Break word (sal-ak, sa lak)          │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 7. Case      │  Random casing (SaLaK, SALAK)        │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 8. Zalgo     │  Add combining marks (s̷a̸l̵a̶k̷)         │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ 9. ZWC       │  Zero-width char injection            │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │10. Emoji Mix │  Intersperse emoji (s🤡a💩l👀a🔥k)    │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │11. VowelDrop │  Remove vowels (slk, grzklı)         │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │12. Reverse   │  Reverse word (kalas)                 │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │13. Doubling  │  Repeat word (salak salak)            │
│  └──────┬───────┘                                       │
│         ▼                                                │
│  Output: transformed word                                │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Difficulty Levels

Each example gets assigned a difficulty based on how many and which transforms are applied:

| Difficulty | Transforms Applied | Probability Weights |
|------------|-------------------|-------------------|
| `easy` | 0-1 transforms (suffix only, or plain) | Low transform probabilities |
| `medium` | 2-3 transforms (suffix + leet + case) | Medium probabilities |
| `hard` | 3-5 transforms (leet + unicode + separator + case) | High probabilities |
| `extreme` | 5+ transforms (all including zalgo, zwc, emoji) | Very high probabilities |

**Distribution target**: 25% easy, 35% medium, 25% hard, 15% extreme.

The generator should assign difficulty BEFORE transforming, then apply the corresponding probability profile.

### 4.5 Template Rendering

```javascript
function renderExample(rng, { root, templates, contexts, transforms, label }) {
  // 1. Decide: template-based (70%) or context-based (30%)
  // 2. Transform the root word
  // 3. If template has {W2}, transform a second random root
  // 4. Fill placeholders
  // 5. Assign difficulty based on transforms applied
  // 6. Return structured object
}
```

### 4.6 Negative Example Generation

Negative examples need their own pipeline:

```javascript
// For negative examples, apply ONLY clean transforms:
// - Turkish suffix addition
// - Random casing (less aggressive)
// - Template filling
// NO leet, NO unicode confusables, NO separators, NO zalgo
// This ensures negative examples stay clean but varied

// ALSO generate these special negative types:
// - Substring trap: clean word that contains a profane substring
// - Quoting context: profane word mentioned in educational/meta context
// - Similar-sounding: words that phonetically resemble profanity but aren't
```

---

## 5. Output Format

### 5.1 JSONL Output

Each line is a valid JSON object:

```jsonl
{"id":"pos-00000","label":1,"category":"general_insult","root":"salak","text":"Sen saaalaaak mısın?","difficulty":"medium","transforms":["suffix","repeat","case"],"meta":{"original":"salak","transformed":"saaalaaak","template":"Sen {W} mısın?","type":"template"}}
{"id":"neg-00000","label":0,"category":"substring_trap","root":"analiz","text":"Bugün analiz raporunu hazırladım.","difficulty":"easy","transforms":[],"meta":{"original":"analiz","transformed":"analiz","template":"Bugün {W} raporunu hazırladım.","type":"template"}}
```

### 5.2 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID: `pos-NNNNN` or `neg-NNNNN` |
| `label` | number | `1` = toxic, `0` = clean |
| `category` | string | See category list below |
| `root` | string | Original root word before transforms |
| `text` | string | Final generated text |
| `difficulty` | string | `easy`, `medium`, `hard`, `extreme` |
| `transforms` | string[] | List of transform names applied |
| `meta` | object | Additional metadata |
| `meta.original` | string | Root word as-is |
| `meta.transformed` | string | Word after all transforms (before template) |
| `meta.template` | string | Template or context used |
| `meta.type` | string | `template` or `context` |

### 5.3 Categories

For positive (label=1):
- `general_insult` — Generic insults (salak, aptal, ahmak)
- `profanity` — Strong profanity / swear words
- `sexual` — Sexual content
- `racist` — Racist / discriminatory
- `threat` — Threats / aggression
- `slang` — Slang / argo
- `abbreviation` — Abbreviated forms (amk, sg)

For negative (label=0):
- `clean_general` — Normal clean text
- `substring_trap` — Contains profane substring but is clean
- `quoting_context` — Mentions profanity in meta/educational context
- `formal` — Formal/academic text
- `similar_sounding` — Phonetically similar to profanity

**How-to**: Map categories by adding a `# CATEGORY:xyz` comment line before a group of roots in `roots_positive.txt`:

```
# CATEGORY:general_insult
salak
aptal
gerizekalı

# CATEGORY:profanity
(words here)

# CATEGORY:abbreviation
amk
sg
```

The loader should parse these category markers and assign them to subsequent roots.

---

## 6. Statistics Output (--stats flag)

When `--stats` is passed, print a summary table:

```
╔══════════════════════════════════════════════════════════╗
║           DATASET GENERATION STATISTICS                  ║
╠══════════════════════════════════════════════════════════╣
║ Total examples:        50,000                            ║
║ Positive (toxic):      25,000 (50.0%)                    ║
║ Negative (clean):      25,000 (50.0%)                    ║
╠──────────────────────────────────────────────────────────╣
║ POSITIVE BY CATEGORY                                     ║
║   general_insult:      8,200 (32.8%)                     ║
║   profanity:           6,500 (26.0%)                     ║
║   sexual:              3,100 (12.4%)                     ║
║   racist:              2,800 (11.2%)                     ║
║   threat:              2,400 (9.6%)                      ║
║   slang:               1,200 (4.8%)                      ║
║   abbreviation:          800 (3.2%)                      ║
╠──────────────────────────────────────────────────────────╣
║ NEGATIVE BY CATEGORY                                     ║
║   clean_general:      12,500 (50.0%)                     ║
║   substring_trap:      5,000 (20.0%)                     ║
║   quoting_context:     3,750 (15.0%)                     ║
║   formal:              2,500 (10.0%)                     ║
║   similar_sounding:    1,250 (5.0%)                      ║
╠──────────────────────────────────────────────────────────╣
║ DIFFICULTY DISTRIBUTION                                  ║
║   easy:               12,500 (25.0%)                     ║
║   medium:             17,500 (35.0%)                     ║
║   hard:               12,500 (25.0%)                     ║
║   extreme:             7,500 (15.0%)                     ║
╠──────────────────────────────────────────────────────────╣
║ TRANSFORM COVERAGE                                       ║
║   suffix:              72.3%                             ║
║   char_repeat:         61.5%                             ║
║   leet:                58.2%                             ║
║   unicode:             34.1%                             ║
║   separator:           55.8%                             ║
║   split:               28.4%                             ║
║   case:                63.7%                             ║
║   zalgo:               12.1%                             ║
║   zwc:                 15.3%                             ║
║   emoji_mix:           10.7%                             ║
║   vowel_drop:          18.9%                             ║
║   reverse:              8.2%                             ║
║   doubling:            14.6%                             ║
╠──────────────────────────────────────────────────────────╣
║ UNIQUE ROOTS USED                                        ║
║   Positive: 127 unique roots                             ║
║   Negative: 89 unique roots                              ║
╠──────────────────────────────────────────────────────────╣
║ AVG TRANSFORMS PER EXAMPLE                               ║
║   easy: 0.4  │  medium: 2.3  │  hard: 4.1  │  extreme: 7.2║
╚══════════════════════════════════════════════════════════╝
```

---

## 7. Validation (--validate flag)

When `--validate` is passed, run these checks:

1. **No duplicates**: Ensure no two examples have identical `text` fields
2. **Label sanity**: Positive examples should contain (or derive from) a profane root; negative examples should NOT
3. **Balance check**: Warn if any category has < 1% representation
4. **Transform coverage**: Warn if any transform is used < 5% of the time
5. **Encoding check**: Verify all output is valid UTF-8
6. **Length check**: Flag examples shorter than 2 chars or longer than 500 chars
7. **JSONL validity**: Parse every line back and verify all required fields exist

---

## 8. Implementation Rules

### DO:

- ✅ Use pure Node.js (no npm dependencies)
- ✅ Use `#!/usr/bin/env node` shebang
- ✅ Use `"use strict"`
- ✅ Make the seeded PRNG (mulberry32) the ONLY source of randomness
- ✅ Handle file-not-found errors gracefully with descriptive messages
- ✅ Support both `\n` and `\r\n` line endings in input files
- ✅ Use streaming writes for large output files (use `fs.createWriteStream`)
- ✅ Log progress every 10,000 examples: `[12,345 / 50,000] generating...`
- ✅ Make the `# CATEGORY:xyz` parsing in roots files work correctly
- ✅ Support `\uXXXX` notation in zalgo_chars.txt and zwc_chars.txt (parse them)
- ✅ Shuffle the final dataset using the seeded PRNG before writing
- ✅ Include a `--dry-run` flag that loads all files and prints stats without generating
- ✅ Produce sample data files with realistic examples (at least 10-15 entries per file)
- ✅ Write clear Turkish console output: `✓ roots_positive.txt yüklendi (127 kök)`, `✗ Dosya bulunamadı: ...`

### DON'T:

- ❌ Don't hardcode ANY word lists, templates, or maps in the generator code
- ❌ Don't use `Math.random()` — only the seeded PRNG
- ❌ Don't load the entire output into memory — stream-write line by line
- ❌ Don't use `require('crypto')` or any external randomness
- ❌ Don't put actual extreme profanity in the sample data files — use placeholder patterns like `[küfür1]`, `[küfür2]` for the truly offensive ones, but DO include mild insults (salak, aptal) as real examples
- ❌ Don't create a `node_modules` directory or `package-lock.json`
- ❌ Don't apply adversarial transforms to negative examples (keep them clean)
- ❌ Don't generate examples where the transformed word is completely unrecognizable (e.g., all chars replaced with symbols)
- ❌ Don't apply more than 2 transforms from the same "family" (e.g., don't do leet + unicode + emoji all replacing the same characters)

---

## 9. Edge Cases to Handle

1. **Short roots** (1-2 chars like "oç"): Skip separator injection and split transforms; these make the word vanish.
2. **Already-obfuscated roots** (like "s*ktir" with asterisks): Treat `*` as a literal character; don't double-obfuscate.
3. **Multi-word roots** (like "hadi ordan"): Treat as atomic unit; apply transforms to the whole phrase.
4. **Emoji-only expressions**: Support roots that are pure emoji sequences (from `emoji_replacements.txt`).
5. **`{W2}` templates**: When a template contains `{W2}`, pick a DIFFERENT root for the second placeholder.
6. **Empty category**: If a category has 0 roots, skip it and log a warning; don't crash.
7. **Very long transforms**: If a transform produces a word > 100 chars, truncate and log.
8. **Unicode normalization**: Apply NFC normalization to the final text to avoid invisible differences.

---

## 10. Sample Output Verification

After generating, the tool should print 5 random examples from each label:

```
─── SAMPLE POSITIVE EXAMPLES ───
[pos-03421] (hard)     "SEN s@l4k  MISIN?"          root=salak  transforms=[leet,case,separator]
[pos-11022] (extreme)  "g̷e̸r̵i̶z̷e̸k̵a̶l̷ı herif"        root=gerizekalı  transforms=[zalgo]
[pos-08334] (easy)     "Aptal!"                      root=aptal  transforms=[]
[pos-19001] (medium)   "DANG4LAK gibi davranma"      root=dangalak  transforms=[leet,case]
[pos-04455] (hard)     "h.ı.y.a.r olm"               root=hıyar  transforms=[separator]

─── SAMPLE NEGATIVE EXAMPLES ───
[neg-00102] (easy)     "Bugün analiz raporunu hazırladım."   root=analiz
[neg-15443] (easy)     "Malatya'dan sipariş geldi."          root=malatya
[neg-08821] (easy)     "Bu konuda Araştırma yapacağız."      root=araştırma
[neg-22100] (easy)     "Toplantıda rapor geçti."             root=rapor
[neg-11003] (easy)     "Merhaba, nasılsınız?"                root=merhaba
```

---

## 11. Testing Checklist

After building, verify:

- [ ] `node generate_dataset.js --dry-run --data ./data` loads all files without error
- [ ] `node generate_dataset.js --pos 100 --neg 100 --seed 42 --stats` produces valid output
- [ ] Running the same command twice with same seed produces IDENTICAL output (byte-for-byte)
- [ ] `--validate` flag catches intentionally broken examples
- [ ] Output JSONL is parseable: `cat output/dataset.jsonl | head -5 | node -e "process.stdin.on('data',d=>d.toString().split('\n').filter(Boolean).forEach(l=>console.log(JSON.parse(l))))"`
- [ ] No hardcoded words exist in generate_dataset.js (grep for any Turkish word)
- [ ] Large generation works: `--pos 50000 --neg 50000` completes in < 30 seconds
- [ ] Memory usage stays flat (streaming writes, no array accumulation for output)

---

## 12. README.md Content

Generate a README.md in Turkish that covers:

1. Ne işe yarar (proje açıklaması)
2. Kurulum (sadece `git clone`, Node.js gereksinimi)
3. Kullanım örnekleri (CLI komutları)
4. Data dosyalarını nasıl düzenlersin
5. Çıktı formatı açıklaması
6. Katkıda bulunma rehberi (yeni kökler, şablonlar ekleme)

---

## 13. Final Notes for Claude Code

- Start by creating the directory structure and all sample data files FIRST
- Then build `generate_dataset.js`
- Test with `--pos 100 --neg 100 --stats --validate` before declaring done
- The generator must be a SINGLE FILE (no splitting into modules) for simplicity
- Keep the code well-commented in Turkish where explaining logic, English for standard code patterns
- Total code should be ~400-600 lines; don't over-engineer but don't under-build