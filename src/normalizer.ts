const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "2": "i", // görsel benzerlik (ters 2 ≈ i)
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g", // görsel benzerlik (6 ≈ g)
  "7": "t",
  "8": "b", // görsel benzerlik (8 ≈ b)
  "9": "g", // görsel benzerlik (9 ≈ g/q)
  "@": "a",
  $: "s",
  "!": "i",
};

function toLowercase(text: string): string {
  return text.toLocaleLowerCase("tr");
}

function replaceTurkishChars(text: string): string {
  let result = "";
  for (const ch of text) {
    result += TURKISH_CHAR_MAP[ch] ?? ch;
  }
  return result;
}

function replaceLeetspeak(text: string): string {
  let result = "";
  for (const ch of text) {
    result += LEET_MAP[ch] ?? ch;
  }
  return result;
}

// Türkçe sayı okunuşları — büyükten küçüğe sıralı (greedy match)
// Tek haneli 6, 8, 9 burada YOK — bunlar leet map'te (6→g, 8→b, 9→g) handle ediliyor.
// Sadece 2→iki (çok yaygın TR evasion) ve çok haneli sayılar burada.
// Kural: harf+sayı+harf (her iki tarafta harf zorunlu)
const TR_NUMBER_MAP: [string, string][] = [
  ["100", "yuz"],
  ["50", "elli"],
  ["10", "on"],
  ["2", "iki"],
];

// Kural: harf + sayı + harf (her iki tarafta da harf olmalı)
// Bağımsız sayılara ve tek taraflı yapışıklığa dokunma
const TR_NUMBER_REGEX = new RegExp(
  TR_NUMBER_MAP.map(([num]) => {
    const escaped = num.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return `(?<=\\p{L})${escaped}(?=\\p{L})`;
  }).join("|"),
  "gu",
);

const TR_NUMBER_LOOKUP: Record<string, string> = Object.fromEntries(TR_NUMBER_MAP);

function expandTurkishNumbers(text: string): string {
  return text.replace(TR_NUMBER_REGEX, (match) => TR_NUMBER_LOOKUP[match] ?? match);
}

function removePunctuation(text: string): string {
  return text.replace(/(?<=\p{L})[.\-_*,;:!?]+(?=\p{L})/gu, "");
}

function collapseRepeats(text: string): string {
  return text.replace(/(.)\1{2,}/g, "$1");
}

function trimWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function normalize(text: string): string {
  let result = text;
  result = toLowercase(result);
  result = replaceTurkishChars(result);
  result = expandTurkishNumbers(result);
  result = replaceLeetspeak(result);
  result = removePunctuation(result);
  result = collapseRepeats(result);
  result = trimWhitespace(result);
  return result;
}

export {
  toLowercase,
  replaceTurkishChars,
  replaceLeetspeak,
  expandTurkishNumbers,
  removePunctuation,
  collapseRepeats,
  trimWhitespace,
};
