# terlik.js — Canlı Test Sunucusu Kullanım Kılavuzu

## Hızlı Başlangıç

```bash
# Proje kök dizininde:
pnpm dev:live
```

Tarayıcıda aç: **http://localhost:2026**

---

## Nasıl Çalıştırılır

### Yöntem 1: npm script ile (önerilen)

```bash
pnpm dev:live
```

Bu komut `tsx watch` kullanır — `src/` altında herhangi bir dosyayı değiştirdiğinde sunucu otomatik olarak yeniden başlar. Build almaya gerek yok.

### Yöntem 2: Doğrudan

```bash
npx tsx live_test_server/server.ts
```

### Yöntem 3: Watch modunda (otomatik yenileme)

```bash
npx tsx watch live_test_server/server.ts
```

---

## Arayüz Rehberi

Sayfa iki panelden oluşur:

### Sol Panel — Chat

- **Mesaj kutusu**: Alta mesajını yaz, Enter veya "Gönder" butonuna bas
- **Kullanıcı mesajı** (mor balon): Gönderdiğin orijinal metin
- **Sistem yanıtı** (koyu balon): Temizlenmiş metin
  - Kırmızı kenarlık = küfür tespit edildi
  - Yeşil kenarlık = temiz mesaj
- **Hızlı test butonları**: Sabit örnek mesajlar — tek tıkla dene

### Sağ Panel — İşlem Süreci (Process Log)

Her mesaj gönderildiğinde, sağ panelde terlik.js'in adım adım neler yaptığını görürsün:

| Adım | Açıklama |
|------|----------|
| **Girdi** | Orijinal metin |
| **Doğrulama** | Karakter sayısı, geçerlilik |
| **Normalizasyon** | Metin nasıl dönüştürüldü (küçük harf, Türkçe karakter, leet, tekrar) |
| **Motor** | Hangi ayarlarla çalıştığı |
| **Tespit** | Kaç eşleşme bulundu |
| **Eşleşme detayları** | Her eşleşme: kelime, kök, pozisyon, seviye, yöntem |
| **Temizleme** | Sonuç ve maskeleme |
| **Toplam süre** | İşlemin kaç ms sürdüğü |

Her adımın yanında geçen süre (ms cinsinden) görünür.

---

## Ayarlar

Alt kısımdaki ayar çubuğundan gerçek zamanlı değiştirebilirsin:

| Ayar | Seçenekler | Varsayılan | Açıklama |
|------|-----------|------------|----------|
| **Mod** | strict / balanced / loose | balanced | Tespit hassasiyeti |
| **Maske** | stars / partial / replace | stars | Maskeleme stili |
| **Fuzzy** | açık / kapalı | kapalı | Bulanık eşleştirme |
| **Eşik** | 0 - 1 | 0.8 | Fuzzy benzerlik eşiği |
| **Algoritma** | levenshtein / dice | levenshtein | Fuzzy algoritması |

### Modlar ne yapar?

- **strict**: Sadece normalize et + tam eşleşme ara. En az false positive, ama evasion'a karşı zayıf.
- **balanced**: Pattern matching ile araya karakter girme, leet speak, tekrar karakterleri yakalar. Günlük kullanım için ideal.
- **loose**: Pattern + fuzzy matching. Yazım hatalarını da yakalar ama daha fazla false positive riski var.

---

## Hızlı Test Senaryoları

Arayüzdeki butonlarla deneyebileceğin senaryolar:

| Buton | Ne test eder |
|-------|-------------|
| temiz mesaj | Küfür içermeyen normal metin |
| düz küfür | Doğrudan yazılmış küfür |
| ayraçlı | `s.i.k.t.i.r` — harfler arası nokta ile evasion |
| leet speak | `$1kt1r` — karakter yerine koyma ile evasion |
| tekrar karakter | `siiiiiktir` — harf tekrarı ile evasion |
| türkçe büyük harf | `SİKTİR` — Türkçe İ/I farkı |
| whitelist test | `sikke` — yanlış pozitif olmamalı |
| çoklu eşleşme | Birden fazla küfür içeren metin |
| false positive | `amsterdam` — whitelist doğrulaması |

---

## Geliştirme İpuçları

### src/ dosyalarını değiştir, sunucu otomatik yenilensin

```bash
pnpm dev:live   # tsx watch modunda çalışır
```

`src/normalizer.ts`, `src/detector.ts` vb. dosyalarda değişiklik yap → sunucu otomatik restart → tarayıcıyı yenile (F5).

### Yeni kelime ekleyip test et

`src/dictionary/tr.ts` dosyasına yeni kelime ekle → kaydet → sunucu yeniden başlar → arayüzde dene.

### Tüm testleri çalıştır

```bash
pnpm test          # Tek sefer
pnpm test:watch    # İzleme modunda (dosya değişince otomatik çalışır)
```

### Build al

```bash
pnpm build         # dist/ klasörüne ESM + CJS çıktı üretir
```

### Benchmark çalıştır

```bash
pnpm bench         # Performans ölçümü
```

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Port 2026 kullanımda | `lsof -i :2026` ile kontrol et, gerekirse `kill` ile kapat |
| Modül bulunamadı hatası | `pnpm install` çalıştır |
| Değişiklikler yansımıyor | `tsx watch` modunda olduğundan emin ol, tarayıcıyı yenile |
| TypeScript hatası | `pnpm typecheck` ile kontrol et |
