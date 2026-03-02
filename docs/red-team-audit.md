# Red-Team Audit Report — terlik.js v2.4.1

**Auditor**: Adversarial AI reviewer
**Date**: 2 March 2026
**Scope**: Full codebase, all 4 languages (TR, EN, ES, DE), benchmarks, docs
**Methodology**: (1) Threat model, (2) Adversarial sample generation (276 new samples), (3) Regex safety analysis, (4) Benchmark fairness validation, (5) Documentation claim verification
**Adversarial test file**: `tests/adversarial-audit.test.ts` (reproducible)

---

## 1. Executive Verdict

**Production-ready** for content moderation as a **first-pass filter** with the following caveats:

- **TR & EN**: Strong. Catches plain, leet, separator, and repetition evasion comprehensively.
- **ES & DE**: Adequate for basic filtering. Smaller dictionaries (28 roots each vs 56 EN, 39 TR).
- **NOT suitable** as a sole defense against determined Unicode-aware attackers (Cyrillic homoglyphs, accented Latin bypasses, fullwidth characters).
- **NOT a replacement** for human moderation or ML-based classifiers for high-stakes contexts.

---

## 2. Verified Strengths

| Claim | Status | Evidence |
|---|---|---|
| ReDoS-safe | **VERIFIED** | 5 pathological inputs (1000 dots, 500 alt sep, 10K near-match, 100 combining marks, suffix chain flood) all complete in <15ms. `tests/adversarial-audit.test.ts > ReDoS stress` |
| Zero dependencies | **VERIFIED** | `package.json` has zero `dependencies`. Only `devDependencies`. |
| ~14 KB gzipped | **VERIFIED** | `gzip -c dist/index.mjs | wc -c` → 13,514 bytes (13.2 KB). Claim is accurate. |
| Turkish İ/ı locale handling | **VERIFIED** | SİKTİR (dotted İ), SIKTIR (ASCII I), sIktIr (mixed) all detected. 3/3 pass. |
| Leet decode (EN) | **VERIFIED** | 9/10 leet combos detected: `5h!7→shit`, `ph@660t→faggot`, `n!664→nigga`, `a55→ass`, `a55hole→asshole`, `d!ck→dick`, `c0ck→cock`, `p3n!5→penis`, `v4g!n4→vagina`. Only `pr0n` missed (transposition, not substitution). |
| Leet decode (TR) | **VERIFIED** | 15/15 evasion samples detected: `$!kt!r`, `0r0spu`, `g0tveren`, `4mk`, `y4rr4k`, `t4s4k`, `p!c`, `k4hpe`, `5erefsiz`, etc. |
| Leet decode (ES) | **VERIFIED** | 8/8 leet combos detected: `m13rd4→mierda`, `put@→puta`, `c4br0n→cabron`, etc. |
| Leet decode (DE) | **VERIFIED** | 7/7 leet combos detected: `f1ck3n→ficken`, `4r5ch→arsch`, `5ch31553→scheisse`, etc. |
| Separator evasion (EN) | **VERIFIED** | Zero-width (ZWSP, ZWNJ), soft hyphen, dots, dashes all caught. |
| Separator evasion (ES) | **VERIFIED** | 4/4: `p.u.t.a`, `m-i-e-r-d-a`, separated hijoputa, `c.o.ñ.o`. |
| Separator evasion (DE) | **VERIFIED** | 3/3: `s.c.h.e.i.ß.e`, `f-i-c-k-e-n`, `a_r_s_c_h`. |
| Repetition collapse | **VERIFIED** | DE `Scheeeeisse`, `Fiiiicken`, `Aaaarsch` all detected. ES `puuuuta`, `mieeeeerda` detected. |
| Whitelist (EN) | **VERIFIED** | 31/31 FP traps passed: assumption, cocktails, therapists, grapevine, Titanic, analytical, cumulonimbus, etc. |
| Whitelist (TR) | **VERIFIED** | 33/34 FP traps passed. Only "sıktı" flagged (debatable — see Finding #5). |
| Whitelist (ES) | **VERIFIED** | 17/17 passed: computadora, disputar, folleto, follaje, pollo, etc. |
| Whitelist (DE) | **VERIFIED** | 12/12 passed: schwanger, schwangerschaft, geschichte, Spastik, Spastiker, etc. |
| Language isolation | **VERIFIED** | 5/5: EN doesn't detect TR/DE, TR doesn't detect EN, DE doesn't detect ES, ES doesn't detect TR. |
| Benchmark adapters fair | **VERIFIED** | All 4 adapters use default/documented constructor patterns. No special options. |
| 100% F1 on benchmark dataset | **NOT INDEPENDENTLY VERIFIED** | Dataset is repo-internal (290 samples). See Section 6 for corpus bias discussion. |

---

## 3. Findings

### FINDING #1 — Accented Latin Character Bypass (EN, ES, DE)

**Severity: HIGH**
**Impact**: Any single accented Latin character (ü, ù, û, î, ï, à, ö, è, etc.) within a profanity word **completely bypasses detection** for all non-Turkish languages.

**Evidence**: 12/12 EN samples, 5/5 ES samples, 6/6 DE samples — ALL bypass detection.

```
fück → false    shît → false    bîtch → false    cünt → false
dìck → false    nïgger → false  fàggot → false   ràpe → false
pörn → false    pûta → false    còño → false      fìck → false
```

**Root cause**: EN `config.charMap` is `{}` (empty). EN `charClasses` don't include accented variants (e.g., `u: "[uv]"` — no ü, ù, û). Characters like ü (U+00FC) fall within the WORD_CHAR range (U+00C0–U+024F), so they're treated as word characters but don't match any charClass pattern.

**TR is immune**: TR `charClasses` include accented variants (e.g., `i: "[iıİ12ìíîï]"`, `o: "[o0öÖòóôõ]"`). TR test confirms: sìktir=true, sîktir=true, oròspu=true.

**Fix**: Extend EN/ES/DE `charClasses` with accented variants matching TR's approach. Or add diacritic folding to `charMap` (e.g., `{ ü: "u", ù: "u", û: "u", ú: "u", ... }`).

**File**: `src/lang/en/config.ts:28-53`, `src/lang/es/config.ts:37-63`, `src/lang/de/config.ts:32-58`

---

### FINDING #2 — Cyrillic Homoglyph Bypass (All Languages)

**Severity: MEDIUM**
**Impact**: Cyrillic look-alike characters (а/a, о/o, с/c, і/i, у/u) can bypass detection. Effect is **inconsistent**: some bypass, some accidentally detected via shorter variant matching.

**Evidence** (EN):
```
fuсk (Cyrillic с) → true   ← accidental: "fuk" variant matches via separator
fуck (Cyrillic у) → true   ← accidental: "fck" variant matches via separator
shіt (Cyrillic і) → true   ← accidental: "sht" variant matches
аss  (Cyrillic а) → false  ← BYPASS: no short variant for "ss"
сunt (Cyrillic с) → false  ← BYPASS: no "unt" variant
diсk (Cyrillic с) → false  ← BYPASS: no "dik" variant
whоre (Cyrillic о) → false ← BYPASS: no "whre" variant
rаpe  (Cyrillic а) → false ← BYPASS: no "rpe" variant
pоrn  (Cyrillic о) → false ← BYPASS: no "prn" variant
```

**Root cause**: Cyrillic characters (U+0400+) fall outside the WORD_CHAR range (U+00C0–U+024F), so they're treated as separators. Detection succeeds **only** when a shorter dictionary variant happens to match the remaining Latin characters around the separator.

**Fix**: Add Unicode confusable normalization step (Cyrillic→Latin mapping) in normalizer. Or extend WORD_CHAR range to include Cyrillic block and add confusable charMap entries.

**File**: `src/normalizer.ts` (new step), `src/patterns.ts:7` (WORD_CHAR range)

---

### FINDING #3 — Fullwidth Character Bypass

**Severity: LOW**
**Impact**: Fullwidth Latin characters (ｆ, ｕ, ｃ, ｋ = U+FF00 block) bypass detection.

**Evidence**:
```
ｆｕｃｋ (all fullwidth) → false
ｓｈｉｔ (all fullwidth) → false
fｕck  (mixed) → true  ← accidental: ｕ is separator, "fck" matches
```

**Root cause**: Fullwidth characters (U+FF00+) outside WORD_CHAR and not in any charMap/leetMap. Same mechanism as Cyrillic — treated as separators.

**Fix**: Add NFKD normalization or fullwidth→ASCII mapping in normalizer.

---

### FINDING #4 — Unicode NFC/NFD Inconsistency

**Severity: LOW**
**Impact**: Same visual character gives different detection results depending on Unicode normalization form.

**Evidence**:
```
fuçk (NFD: c + combining cedilla) → true   ← combining mark = separator
fuçk (NFC: precomposed ç)          → false  ← ç in WORD_CHAR, not in [c] charClass
shî̧t (NFD) → true / shît (NFC) → false      ← same inconsistency
```

**Fix**: Add `text.normalize("NFKD")` as first step in normalizer pipeline.

**File**: `src/normalizer.ts:78` (add before toLowerCase)

---

### FINDING #5 — Turkish "sıktı" False Positive

**Severity: MEDIUM (debatable)**
**Impact**: "sıktı" (past tense of "sıkmak" = to squeeze/tighten) is flagged as profanity.

**Evidence**: `tr.containsProfanity("sıktı")` → `true`, matched as root "sik", method "pattern".

**Root cause**: After normalization: ı→i → "sikti". "sikti" IS an explicit variant of the "sik" root in dictionary.json.

**Mitigation**: This is a deliberate trade-off. "sıktı" is commonly used as a euphemism for "sikti" in Turkish. Whitelisting it would create a trivial bypass. Severity depends on use case.

**Fix (if desired)**: Add "sıktı" to TR whitelist. Accept the trade-off of euphemism bypass.

---

### FINDING #6 — TR Suffix Engine Overflow for "sik" Entry

**Severity: MEDIUM**
**Impact**: The "sik" root (39 variants) generates a regex of 8,058 chars. Adding the Turkish suffix group (83 suffixes) would push it over MAX_PATTERN_LENGTH (10,000), triggering the safety guard that strips ALL suffix matching.

**Evidence**:
```
tr.getPatterns().get("sik").source.includes("{0,2}") → false  ← No suffix group!
tr.containsProfanity("siktirci") → false  ← "siktir" + suffix "ci" not caught
```

**Root cause**: `src/patterns.ts:134-140` — safety guard fallback strips suffix group when pattern exceeds 10K chars.

**Impact**: Any suffixed form of any "sik" variant not explicitly listed in dictionary goes undetected. Examples: siktirci, siktiret, sikimlerin...

**Fix options**:
1. Increase MAX_PATTERN_LENGTH (risk: longer regex compilation)
2. Split the "sik" entry into multiple entries (sik + siktir as separate roots)
3. Reduce variant count by relying more on suffix engine (remove variants like "siktiler" that are just "sikti" + suffix "ler")

**File**: `src/patterns.ts:12` (`MAX_PATTERN_LENGTH = 10000`), `src/lang/tr/dictionary.json:28-46` (sik entry)

---

### FINDING #7 — 3-char Root Suffix Gap (TR "göt", EN "cum", "tit")

**Severity: LOW**
**Impact**: Non-suffixable roots with ≤3 normalized characters get strict boundary matching (no suffix). This prevents "götlük", but is **intentional** to avoid false positives on "got", "gotik", etc.

**Evidence**:
```
tr.containsProfanity("götlük") → false  ← "got" (3 chars) → strict boundary
```

**Root cause**: `src/patterns.ts:106` — `MIN_VARIANT_SUFFIX_LEN = 4`. Roots ≤3 chars always get strict boundary.

**This is by design**: Short roots without suffix matching prevent massive FP on words like "got" (in English), "assumption" (ass), "button" (but).

**Fix (if desired)**: Add "gotluk" as explicit variant in dictionary.

---

### FINDING #8 — Compound/CamelCase/Hashtag Profanity Not Detected (EN)

**Severity: MEDIUM**
**Impact**: Profanity concatenated with other words goes undetected due to word boundary requirements.

**Evidence**:
```
FuckYou     → false  ← Y is word char → boundary fails
fuckwad     → false  ← w is word char → boundary fails
#fuckyou    → false  ← normalizes to "hfuckyou", h is word char
fuck123     → false  ← 1 is word char (digits in WORD_CHAR)
shitlord    → false
cockwomble  → false
twatwaffle  → false
cumguzzler  → false
dickweasel  → false
```

**Root cause**: WORD_BOUNDARY_AHEAD `(?![a-zA-Z0-9À-ɏ])` requires no word character after the match. Compound words have word chars immediately after the profanity root.

**This is by design**: Without boundary requirements, false positives would explode (assumption→ass, constitution→tit, etc.).

**Trade-off**: Detection accuracy vs false positive rate. Current design prioritizes low FPR.

**Possible fix**: Add common compounds as explicit variants (fuckwad, shitlord, etc.).

---

### FINDING #9 — Missing Vocabulary (EN)

**Severity: LOW**
**Impact**: Several common profanity terms not in dictionary.

**Not detected** (0/13):
```
wop, spaz, cracker, honky, beaner        ← ethnic/ableist slurs
MILF, GTFO, FFS, SOB                     ← profanity acronyms
hoe, thot                                ← modern slang
knob                                     ← British insult
freaking, effing                         ← euphemisms
```

**Note**: This is acknowledged in README under "Not Covered" → "Rapidly evolving slang". The library uses `addWords()` for runtime extension. The narrow dictionary is a deliberate design choice to minimize FP.

---

### FINDING #10 — Spanish "cojonudo" False Positive

**Severity: LOW (cultural)**
**Impact**: "cojonudo" (colloquial Spanish for "great/awesome") is detected because it's listed as a variant of "cojones".

**Evidence**: `es.containsProfanity("cojonudo")` → `true`, root "cojones".

**Context**: "cojonudo" is etymologically profane but has evolved to a positive colloquial meaning in modern Spanish. Whether this is a FP depends on use case and audience.

**Fix**: Remove "cojonudo" from cojones variants, or add to ES whitelist.

---

## 4. Things I Tried to Break and Failed

| Attack | Result | Notes |
|---|---|---|
| ReDoS with 1000 dots + profanity | **7.4ms** | Bounded separator {0,3} prevents catastrophic backtracking |
| ReDoS with 500 alternating chars | **5.0ms** | No regex state explosion |
| ReDoS with 10K near-match input | **2.5ms** | maxLength truncation + bounded patterns |
| ReDoS with 100 combining marks | **14.2ms** | Combining marks treated as separators, no backtracking |
| ReDoS with TR suffix chain flood | **6.0ms** | MAX_SUFFIX_CHAIN=2 prevents deep nesting |
| Zero-width space between chars | **Detected** | ZWSP, ZWNJ, soft hyphen all treated as separators |
| Turkish İ→i locale attacks | **Detected** | Proper toLocaleLowerCase("tr") + charMap |
| Mixed case (SiKtIr) | **Detected** | Locale-aware lowering handles all cases |
| Number expansion exploit | **Safe** | 100 only expands between letters (not standalone) |
| Whitelist bypass via leet | **Safe** | "s1kke" normalizes to "sikke" → whitelisted |
| Whitelist bypass via suffix | **Safe** | "sikkeleri" → surrounding word check → whitelisted |
| Cross-language leakage | **No leakage** | 5/5 isolation tests pass |
| FP on Spastik/Spastiker (DE) | **Safe** | "spasti" variant + boundary → "Spastik" not flagged |
| FP on peacocking (EN) | **Safe** | "peacock" is whitelisted |
| FP on assumption (EN) | **Safe** | "ass" strict boundary → no FP |
| FP on cumulonimbus (EN) | **Safe** | "cum" strict boundary → no FP |
| FP on Titanic (EN) | **Safe** | "tit" strict boundary → no FP |
| FP on analytical (EN) | **Safe** | "analysis" is whitelisted |
| FP on therapists (EN) | **Safe** | "therapist" is whitelisted |
| Benchmark adapter manipulation | **Fair** | All adapters use documented default constructors |
| Pattern cache poisoning | **Safe** | Custom dictionaries get null cacheKey |

---

## 5. Documentation Claim Verification

| Claim | Verdict | Evidence |
|---|---|---|
| "~14 KB gzipped" | **Accurate** | 13,514 bytes measured |
| "Zero dependencies" | **Accurate** | package.json confirmed |
| "ReDoS-safe regex patterns" | **Accurate** | 5/5 stress tests pass under 15ms |
| "100% F1 on English corpus" | **Accurate for dataset** | Dataset is internal; see bias discussion below |
| "972 tests" | **Accurate** | 972 existing + 276 adversarial = 1248 total pass |
| "Node 18+" support | **Accurate** | CI matrix tests Node 18 and 20 |
| "Lazy compilation ~1.5ms" | **NOT VERIFIED** | No independent measurement performed |
| "81K ops/sec" | **NOT VERIFIED** | Hardware-dependent, not independently measured |

---

## 6. Benchmark Corpus Bias Assessment

**Concern**: The 290-sample benchmark dataset is maintained by the same author who develops the library. This creates inherent bias risk — the dictionary can be tuned to ace its own test.

**Mitigating factors**:
1. Dataset includes 70 whitelist traps (24%) — higher than competitors test
2. Evasion categories (separator, repetition, leet, combined) make up 70 samples (24%)
3. 50 clean/negative samples (17%) provide FP testing
4. Category breakdown is published and reproducible

**Remaining concern**: 290 samples is statistically marginal. With 100% accuracy on 290 samples, the 95% Wilson confidence interval for true accuracy is approximately [98.7%, 100%]. The "100%" claim should ideally include confidence bounds.

**Recommendation**: Add an external corpus (e.g., Hatebase, HateXplain, or Jigsaw Toxic Comments subset) for independent validation. Publish methodology for corpus selection.

---

## 7. Severity Summary

| Severity | Count | Findings |
|---|---|---|
| HIGH | 2 | #1 (accented bypass), #2 (Cyrillic bypass) |
| MEDIUM | 4 | #5 (sıktı FP), #6 (suffix overflow), #7 (3-char root gap), #8 (compound/CamelCase) |
| LOW | 4 | #3 (fullwidth), #4 (NFC/NFD), #9 (missing vocab), #10 (cojonudo FP) |

---

## 8. Recommended Priority Fixes

1. **[HIGH] Add diacritic folding to EN/ES/DE charMap** — Blocks the #1 accented bypass with minimal effort. Add `{ ü: "u", ù: "u", û: "u", ú: "u", ì: "i", î: "i", ï: "i", í: "i", à: "a", â: "a", ã: "a", á: "a", ò: "o", ô: "o", õ: "o", ó: "o", è: "e", ê: "e", ë: "e", é: "e" }` to each config's charMap.

2. **[HIGH] Add NFKD normalization** — Blocks #2 (Cyrillic), #3 (fullwidth), and #4 (NFC/NFD) with a single `text.normalize("NFKD")` call. NFKD decomposes fullwidth→ASCII, decomposes combining marks, and normalizes confusables.

3. **[MEDIUM] Split "sik" entry** — Reduce variant count to stay under MAX_PATTERN_LENGTH. Move "siktir" and its variants to a separate entry with `suffixable: true`.

4. **[MEDIUM] Add common compounds as variants** — fuckwad, shitlord, etc. for EN.

---

## Repro Appendix

```bash
# Environment
node --version   # v24.4.0
pnpm --version   # 9.x
uname -a         # Darwin 24.6.0 arm64

# Run adversarial audit tests
pnpm vitest run tests/adversarial-audit.test.ts

# Verify bundle size
gzip -c dist/index.mjs | wc -c

# Run full test suite (should be 1248+ tests passing)
pnpm vitest run

# Extract regex patterns for inspection
pnpm vitest run tests/adversarial-audit.test.ts 2>&1 | grep '\[AUDIT\]'
```

---

*Report generated by adversarial AI auditor. All findings backed by reproducible test evidence in `tests/adversarial-audit.test.ts`.*
