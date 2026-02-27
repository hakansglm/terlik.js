export const MAX_INPUT_LENGTH = 10_000;

export function validateInput(text: string, maxLength: number): string {
  if (text == null) return "";
  if (typeof text !== "string") return String(text);
  if (text.length > maxLength) return text.slice(0, maxLength);
  return text;
}
