# SPDG Automated Test

Synthetic Profanity Dataset Generator (SPDG) tarafindan uretilen sentetik dataset'leri terlik.js detection motoruna karsi otomatik olarak test eden pipeline.

## Amac

Statik birim testleri bilinen case'leri dogrular. SPDG automated test ise **yuzlerce rastgele uretilmis evasion pattern'ini** (leet speak, zalgo, separator, zero-width, unicode homoglyph, vowel drop, reverse, emoji mix vb.) detection motoruna karsi kosar ve **istatistiksel basari oranlarini** olcer.

Bu yaklasim:
- Birim testlerinin yakalayamadigi **edge case'leri** ortaya cikarir
- Detection motorundaki **regression'lari** erken tespit eder
- Dil bazinda **detection kalitesini** olculebilir metriklere donusturur
- Yeni evasion pattern'leri eklendikce dataset buyutulerek **kapsam genisletilir**

## Hizli Baslangic

```bash
# Tek komut: dataset uret + test calistir
pnpm spdg

# Sadece dataset uret (4 dil, 500+500, seed 42)
pnpm spdg:generate

# Sadece SPDG testlerini calistir (JSONL mevcut olmali)
pnpm test:spdg
```

## Pipeline

```
pnpm spdg
  │
  ├── pnpm spdg:generate
  │     ├── generate_dataset.js --tr --pos 500 --neg 500 --seed 42
  │     ├── generate_dataset.js --en --pos 500 --neg 500 --seed 42
  │     ├── generate_dataset.js --es --pos 500 --neg 500 --seed 42
  │     └── generate_dataset.js --de --pos 500 --neg 500 --seed 42
  │     → output/export-{tr,en,es,de}.jsonl
  │
  └── pnpm test:spdg
        → vitest run tests/spdg-automated-test.test.ts
        → 4 dil × 2 test = 8 test case
```

## Package.json Script'leri

| Script | Komut | Aciklama |
|--------|-------|----------|
| `spdg:generate` | `node generate_dataset.js ...` | 4 dil icin JSONL uret (500 pozitif + 500 negatif, seed 42) |
| `test:spdg` | `vitest run tests/spdg-automated-test.test.ts` | Sadece SPDG testlerini calistir |
| `spdg` | `pnpm spdg:generate && pnpm test:spdg` | Tek komut: uret + test |

## Test Dosyasi Yapisi

`tests/spdg-automated-test.test.ts`:

```
describe("SPDG Automated Tests")
  ├── describe.skipIf(!trExists) "TR"
  │     ├── beforeAll → JSONL parse + Terlik init
  │     ├── it "pozitif ornekler profanity olarak algilanmali (difficulty threshold)"
  │     └── it "negatif ornekler clean olarak algilanmali (<5% false positive)"
  ├── describe.skipIf(!enExists) "EN"  — ayni yapi
  ├── describe.skipIf(!esExists) "ES"  — ayni yapi
  └── describe.skipIf(!deExists) "DE"  — ayni yapi
```

### Akis

1. `existsSync` ile JSONL kontrolu — yoksa `describe.skipIf` ile sessizce atla
2. `beforeAll` icinde JSONL parse + `new Terlik({ language })` init
3. Pozitif ornekler (label=1): `containsProfanity(text) === true` beklenir
4. Negatif ornekler (label=0): `containsProfanity(text) === false` beklenir
5. Difficulty bazinda detection rate hesapla + threshold assert
6. Console'a detayli istatistik raporu yazdir

### JSONL Formati

Her satir bagimsiz bir JSON:

```json
{"text":"s.i.k.t.i.r git","label":1,"root":"sik","difficulty":"medium","transforms":["separator"],"category":"positive"}
{"text":"bugün ambalaj aldım","label":0,"root":"ambalaj","difficulty":"clean","transforms":[],"category":"negative"}
```

| Alan | Tip | Aciklama |
|------|-----|----------|
| `text` | string | Test edilecek metin |
| `label` | 0 / 1 | 0 = clean, 1 = toxic |
| `root` | string | Kaynak kok kelime |
| `difficulty` | string | easy / medium / hard / extreme / clean |
| `transforms` | string[] | Uygulanan evasion transform'lari |
| `category` | string | positive / negative |

## Threshold'lar

### Pozitif Detection Rate (label=1)

Difficulty bazinda minimum detection orani:

| Difficulty | Min Rate | Transform Sayisi | Aciklama |
|-----------|----------|-----------------|----------|
| easy | %85 | 0-1 | Duz metin veya tek transform |
| medium | %70 | 1-2 | Leet speak, case, separator vb. |
| hard | %40 | 2-3 | Coklu transform kombinasyonu |
| extreme | — | 3-5 | Sadece rapor, fail etmez |

Threshold'lar `tests/spdg-automated-test.test.ts` icindeki `POSITIVE_THRESHOLDS` objesiyle kontrol edilir.

**Neden extreme fail etmez?** Extreme ornekler 3-5 transform birlestirir (ornegin reverse + zalgo + emoji mix + separator). Bu seviyede detection rate dogal olarak dusuktur ve motorun sinirlarini olcmeye yarar, pass/fail kriteri olarak kullanilmaz.

### Negatif False Positive Rate (label=0)

| Metrik | Limit | Aciklama |
|--------|-------|----------|
| False Positive Rate | <%5 | Clean metinlerin profanity olarak yanlis algilanma orani |

`FALSE_POSITIVE_LIMIT` sabiti ile kontrol edilir.

## Ornek Cikti

Test calistirildikinda console'a detayli rapor yazdirilir:

```
📊 SPDG Pozitif Detection [TR]:
  [TR] easy: 116/124 (93.5%) — min 85%
  [TR] medium: 125/164 (76.2%) — min 70%
  [TR] hard: 67/130 (51.5%) — min 40%
  [TR] extreme: 42/82 (51.2%) — rapor only

📊 SPDG Negatif FP [TR]: 3/500 (0.6%)
   Ornek FP'ler: "sikke ile ilgili bir yazi" (root: sikke), ...
```

### Referans Sonuclar (seed 42, 500+500)

| Dil | Easy | Medium | Hard | Extreme | FP Rate |
|-----|------|--------|------|---------|---------|
| TR | 93.5% | 76.2% | 51.5% | 51.2% | 0.6% |
| EN | 93.0% | 71.8% | 64.2% | 40.9% | 0.0% |
| ES | 93.3% | 83.1% | 62.5% | 45.8% | 0.0% |
| DE | 88.7% | 80.1% | 63.9% | 39.1% | 0.0% |

## Mevcut Testlere Etki

- `pnpm test` komutu `tests/**/*.test.ts` pattern'ini tarar — SPDG test dosyasini da bulur
- JSONL dosyalari **yoksa**: `describe.skipIf` ile tum SPDG bloklari atlanir → **sifir etki**
- JSONL dosyalari **varsa**: SPDG testleri de calisir, mevcut testlerle birlikte raporlanir
- Mevcut test dosyalarina hicbir degisiklik yapilmaz

```bash
# JSONL yok → 20 passed, 1 skipped (SPDG), 1333 tests passed, 8 skipped
pnpm test

# JSONL var → 21 passed, 1341 tests passed (1333 mevcut + 8 SPDG)
pnpm spdg:generate && pnpm test
```

## Deterministic Cikti

SPDG, mulberry32 PRNG kullanir. Ayni `--seed` degeri byte-identical JSONL uretir:

```bash
node generate_dataset.js --tr --pos 500 --neg 500 --seed 42
node generate_dataset.js --tr --pos 500 --neg 500 --seed 42
# md5sum export-tr.jsonl → ayni hash
```

Bu sayede:
- CI'da tekrarlanabilir test sonuclari
- Detection rate degisiklikleri izlenebilir (motor degisikligi → rate degisikligi)
- Farkli seed'lerle farkli dataset'ler uretilerek kapsam genisletilir

## Dosya Konumlari

```
terlik.js/
├── tests/
│   └── spdg-automated-test.test.ts          ← Test dosyasi
├── tools/
│   └── Synthetic-Profanity-Dataset-Generator/
│       ├── generate_dataset.js               ← SPDG ureteci
│       ├── data/{tr,en,es,de}/               ← Dil verileri
│       ├── output/export-{lang}.jsonl        ← Uretilen dataset'ler
│       └── README.md                         ← SPDG dokumantasyonu
└── docs/
    └── spdg-automated-test.md               ← Bu dokuman
```

## Threshold Ayarlama

Detection motoru iyilestirildikce threshold'lar yukseltilebilir:

```typescript
// tests/spdg-automated-test.test.ts
const POSITIVE_THRESHOLDS: Record<string, number | null> = {
  easy: 85,      // ← yukseltilebilir (ornegin %90)
  medium: 70,    // ← yukseltilebilir
  hard: 40,      // ← yukseltilebilir
  extreme: null,  // null = sadece rapor, fail etmez
};

const FALSE_POSITIVE_LIMIT = 5; // ← dusurulabilir (ornegin %3)
```

**Onemli:** Threshold degisiklikleri tum 4 dilin gectiginden emin olunduktan sonra yapilmalidir. `pnpm spdg` komutu ile dogrulama yapilabilir.

## Dataset Boyutunu Degistirme

`package.json` icindeki `spdg:generate` script'ini duzenleyerek ornnek sayisi degistirilebilir:

```bash
# Varsayilan: 500 pozitif + 500 negatif (hizli, CI icin uygun)
--pos 500 --neg 500

# Daha kapsamli: 5000 + 5000 (daha guvenilir istatistikler)
--pos 5000 --neg 5000

# Tam set: 20000 + 20000 (SPDG varsayilani)
--pos 20000 --neg 20000
```

Daha buyuk dataset'ler daha guvenilir istatistikler verir ancak test suresi artar.

## Yeni Dil Ekleme

SPDG'ye yeni dil eklendikten sonra test pipeline'ina dahil etmek icin:

1. `tools/Synthetic-Profanity-Dataset-Generator/data/{xx}/` klasorunu olustur
2. `package.json` `spdg:generate` script'ine `&& node ... --xx ...` ekle
3. `tests/spdg-automated-test.test.ts` icindeki `LANGUAGES` array'ine `"xx"` ekle
4. `pnpm spdg` ile dogrula

## Ilgili Dokumanlar

- [SPDG README](../tools/Synthetic-Profanity-Dataset-Generator/README.md) — Dataset ureteci dokumantasyonu
- [API Reference](./api.md) — terlik.js API dokumantasyonu
- [Benchmark Comparison](./benchmark-comparison.md) — Performans karsilastirmalari
- [Red Team Audit](./red-team-audit.md) — Adversarial test raporu
