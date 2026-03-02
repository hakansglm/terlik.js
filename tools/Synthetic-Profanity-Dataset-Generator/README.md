# Synthetic Profanity Dataset Generator

terlik.js icin sentetik profanity veri seti ureteci. Dil bazli, deterministic, streaming cikti destekli.

## Hizli Baslangic

```bash
# Turkce veri seti uret (varsayilan 20K pos + 20K neg)
node generate_dataset.js --tr --stats

# Ingilizce, kucuk set, dogrulama ile
node generate_dataset.js --en --pos 1000 --neg 1000 --stats --validate

# Sadece dosyalari yukle, uretim yapma
node generate_dataset.js --tr --dry-run
```

## CLI Parametreleri

| Flag | Varsayilan | Aciklama |
|------|-----------|----------|
| `--lang <kod>` | (zorunlu) | Hedef dil kodu |
| `--tr` / `--en` / `--es` / `--de` | — | Dil kisayolu (`--lang` yerine) |
| `--pos <sayi>` | 20000 | Pozitif (toxic) ornek sayisi |
| `--neg <sayi>` | 20000 | Negatif (clean) ornek sayisi |
| `--seed <sayi>` | 42 | PRNG seed (deterministic cikti icin) |
| `--data <yol>` | `./data` | Data dizini |
| `--out <yol>` | `./output` | Cikti dizini |
| `--format <tip>` | jsonl | `jsonl`, `csv` veya `both` |
| `--stats` | false | Istatistik tablosu yazdir |
| `--difficulty <seviye>` | all | `easy`, `medium`, `hard`, `extreme`, `all` |
| `--validate` | false | Dogrulama kontrolleri calistir |
| `--dry-run` | false | Dosyalari yukle, uretim yapma |

## Cikti Formati

### JSONL (varsayilan)

Her satir bagimsiz bir JSON nesnesidir:

```json
{"text":"seni s4l4k","label":1,"root":"salak","difficulty":"medium","transforms":["leet"],"category":"positive"}
{"text":"bugün ambalaj aldım","label":0,"root":"ambalaj","difficulty":"clean","transforms":[],"category":"negative"}
```

| Alan | Tip | Aciklama |
|------|-----|----------|
| `text` | string | Uretilen metin (NFC normalize) |
| `label` | 0/1 | 0 = clean, 1 = toxic |
| `root` | string | Kaynak kok kelime |
| `difficulty` | string | easy/medium/hard/extreme/clean |
| `transforms` | string[] | Uygulanan transformlar |
| `category` | string | positive/negative |

## Dizin Yapisi

```
data/
├── shared/              # Dil-bagimsiz veriler
│   ├── separators.txt   # Ayirici karakterler
│   ├── unicode_map.txt  # Unicode homoglyph esleme
│   ├── zalgo_chars.txt  # Zalgo combining karakterler
│   └── zwc_chars.txt    # Zero-width karakterler
├── tr/                  # Turkce
│   ├── roots_positive.txt
│   ├── roots_negative.txt
│   ├── templates_positive.txt
│   ├── templates_negative.txt
│   ├── contexts_positive.txt
│   ├── contexts_negative.txt
│   ├── suffixes.txt
│   ├── leet_map.txt
│   └── emoji_replacements.txt
├── en/  (ayni 9 dosya)
├── es/  (ayni 9 dosya)
└── de/  (ayni 9 dosya)
```

## Transformlar (13 adet)

| Transform | Aile | Aciklama |
|-----------|------|----------|
| suffix | morphological | Dil-bazli ek ekleme |
| charRepeat | repetition | Karakter tekrari (saaaalak) |
| leet | substitution | Leet speak (s4l4k) |
| unicode | substitution | Unicode homoglyph |
| separator | separator | Ayirici ekleme (s.a.l.a.k) |
| split | separator | Kelime bolme (sal ak) |
| case | casing | Buyuk/kucuk harf varyasyonu |
| zalgo | obfuscation | Zalgo text |
| zwc | obfuscation | Zero-width karakter ekleme |
| emojiMix | substitution | Emoji araya ekleme |
| vowelDrop | morphological | Unlu dusurme (slk) |
| reverse | morphological | Ters cevirme |
| doubling | repetition | Karakter ikizleme |

## Zorluk Seviyeleri

| Seviye | Oran | Transform Sayisi |
|--------|------|-----------------|
| easy | %25 | 0-1 |
| medium | %35 | 1-2 |
| hard | %25 | 2-3 |
| extreme | %15 | 3-5 |

## Deterministic Cikti

Ayni `--seed` degeri ile calistirildiginda byte-identical cikti uretilir:

```bash
node generate_dataset.js --tr --pos 100 --neg 100 --seed 42
node generate_dataset.js --tr --pos 100 --neg 100 --seed 42
# Iki cikti dosyasi aynidir
```

## Veri Dosyasi Formatlari

### roots_positive.txt / roots_negative.txt
Her satirda bir kok kelime. `#` ile baslayan satirlar yorum.

### templates_positive.txt / templates_negative.txt
`{word}` placeholder'i kok kelime ile degistirilir.

### contexts_positive.txt / contexts_negative.txt
Daha uzun cumle sablonlari. `{word}` placeholder'i kullanir.

### leet_map.txt / unicode_map.txt
`harf -> karsilik1,karsilik2` formati.

### suffixes.txt / separators.txt / emoji_replacements.txt / zalgo_chars.txt / zwc_chars.txt
Her satirda bir girdi. Unicode escape (`\uXXXX`) desteklenir.

## Test Entegrasyonu

Uretilen dataset'ler `tests/spdg-automated-test.test.ts` uzerinden vitest'e baglidir:

```bash
pnpm spdg          # dataset uret + test calistir (tek komut)
pnpm spdg:generate # sadece 4 dil JSONL uret (500+500, seed 42)
pnpm test:spdg     # sadece SPDG testlerini calistir
```

Test dosyasi:
- JSONL yoksa `describe.skipIf` ile sessizce atlar — mevcut testlere sifir etki
- label=1: `containsProfanity() === true` beklenir (difficulty bazinda threshold)
- label=0: `containsProfanity() === false` beklenir (<%5 false positive)
- Console'a detayli istatistik raporu yazdirir

Detayli dokumantasyon: [SPDG Automated Test](../../docs/spdg-automated-test.md)
