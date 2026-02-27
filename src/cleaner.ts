import type { MaskStyle, MatchResult } from "./types.js";

function maskStars(word: string): string {
  return "*".repeat(word.length);
}

function maskPartial(word: string): string {
  if (word.length <= 2) return "*".repeat(word.length);
  return word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
}

function maskReplace(replaceMask: string): string {
  return replaceMask;
}

export function applyMask(word: string, style: MaskStyle, replaceMask: string): string {
  switch (style) {
    case "stars":
      return maskStars(word);
    case "partial":
      return maskPartial(word);
    case "replace":
      return maskReplace(replaceMask);
  }
}

export function cleanText(
  text: string,
  matches: MatchResult[],
  style: MaskStyle,
  replaceMask: string,
): string {
  if (matches.length === 0) return text;

  // Sort by index descending so we can replace from end to start
  // without invalidating earlier indices
  const sorted = [...matches].sort((a, b) => b.index - a.index);

  let result = text;
  for (const match of sorted) {
    const masked = applyMask(match.word, style, replaceMask);
    result = result.slice(0, match.index) + masked + result.slice(match.index + match.word.length);
  }

  return result;
}
