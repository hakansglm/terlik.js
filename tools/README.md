# terlik.js — Live Test Server

An interactive browser-based test environment for terlik.js. Send messages in a chat interface, see profanity detection results in real-time, and inspect every step of the normalization and pattern matching pipeline.

## Quick Start

```bash
pnpm dev:live
```

Open **http://localhost:2026** in your browser.

---

## How to Run

### Option 1: npm script (recommended)

```bash
pnpm dev:live
```

Uses `tsx watch` — the server auto-restarts when you edit any file under `src/`. No build step needed.

### Option 2: Direct

```bash
npx tsx tools/server.ts
```

### Option 3: Watch mode (manual)

```bash
npx tsx watch tools/server.ts
```

---

## Interface Guide

The page is split into two panels:

### Left Panel — Chat

- **Message input**: Type a message at the bottom, press Enter or click "Gönder"
- **User message** (purple bubble): Your original text
- **System response** (dark bubble): Cleaned text
  - Red border = profanity detected
  - Green border = clean message
- **Quick test buttons**: Pre-built test scenarios — click to send instantly

### Right Panel — Process Log

Every message you send generates a step-by-step log showing exactly what terlik.js did:

| Step | Description |
|------|-------------|
| **Girdi** | Original input text |
| **Doğrulama** | Character count, validation |
| **Normalizasyon** | How the text was transformed (lowercase, Turkish chars, leet decode, number expansion, repeat collapse) |
| **Motor hazır** | Engine config (mode, mask style, fuzzy, custom words, whitelist) |
| **Tespit** | Number of matches found |
| **Eşleşme #N** | Each match: word, root, position, severity, detection method |
| **Temizleme** | Final masked result |
| **Tamamlandı** | Total processing time (ms) |

Each step shows its individual timing in milliseconds.

---

## Settings

Settings are organized in three collapsible sections below the quick test buttons. Click a section title to collapse/expand.

### Detection Settings

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| **Mod** | strict / balanced / loose | balanced | Detection sensitivity |
| **Maskeleme** | stars / partial / replace | stars | Mask style for profanity |
| **Maske metni** | any text | `[***]` | Custom mask text (only visible when "replace" is selected) |

**Modes explained:**
- **strict**: Normalize + exact match only. Fewest false positives, but weak against evasion.
- **balanced**: Pattern matching with separator, leet speak, and repetition tolerance. Best for general use.
- **loose**: Pattern + fuzzy matching. Catches typos but higher false positive risk.

### Fuzzy Matching

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| **Aktif** | on / off | off | Toggle fuzzy matching |
| **Eşik** | 0.0 - 1.0 | 0.8 | Similarity threshold (lower = more tolerant) |
| **Algoritma** | levenshtein / dice | levenshtein | Fuzzy algorithm |

### Dictionary Management

| Setting | Description |
|---------|-------------|
| **Ekstra yakalanacak kelimeler** | Add custom words to detect, comma-separated. These are added on top of the built-in dictionary. Example: `hiyar, kodumun` |
| **Yakalanmasın (whitelist)** | Words to exclude from detection, comma-separated. Use this to prevent false positives on specific words. Example: `testword` |

### normalize() Button

Next to the send button, there's a **normalize()** button. It takes the text from the input field and runs only the normalization pipeline (no detection). The result appears in the process log. Useful for inspecting how terlik.js transforms text before matching.

---

## Quick Test Scenarios

| Button | What it tests |
|--------|---------------|
| temiz mesaj | Clean text, no profanity |
| düz küfür | Plain profanity |
| ayraçlı | `s.i.k.t.i.r` — dot separator evasion |
| leet speak | `$1kt1r` — character substitution evasion |
| tekrar karakter | `siiiiiktir` — character repetition evasion |
| türkçe büyük harf | `SİKTİR` — Turkish İ/I case handling |
| whitelist test | `sikke` — should NOT be flagged (Ottoman coin) |
| çoklu eşleşme | Multiple profanities in one message |
| false positive | `amsterdam` — whitelist verification |
| visual leet 8→b | `8ok` — visual similarity (8 looks like b) |
| visual leet 6→g | `6öt` — visual similarity (6 looks like g) |
| visual leet i8ne | `i8ne` — mixed visual leet |
| TR sayı s2mle | `s2mle` — Turkish number word expansion (2 = iki) |

---

## Development Tips

### Auto-reload on source changes

```bash
pnpm dev:live   # tsx watch mode
```

Edit `src/normalizer.ts`, `src/detector.ts`, `src/dictionary/tr.ts`, etc. → server auto-restarts → refresh the browser (F5).

### Add words via UI

Use the "Ekstra yakalanacak kelimeler" field to test custom words without editing source code. Type comma-separated words and send a message — the engine will include them.

### Add words via source

Edit `src/dictionary/tr.ts` → save → server restarts → test in the browser.

### Run the test suite

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
```

### Build

```bash
pnpm build         # outputs ESM + CJS to dist/
```

### Benchmark

```bash
pnpm bench         # performance measurement (msgs/sec)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 2026 in use | `lsof -i :2026` to check, `kill <PID>` to free it |
| Module not found | Run `pnpm install` |
| Changes not reflected | Make sure you're in `tsx watch` mode, then refresh the browser |
| TypeScript error | Run `pnpm typecheck` to diagnose |
