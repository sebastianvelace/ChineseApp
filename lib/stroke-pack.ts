import glyphs from "../public/strokes/index.json";

const PACK = new Set(glyphs);

export function hasStroke(char: string): boolean {
  return PACK.has(char);
}

/** First single-character target in the pack, else the first packed character of a later target. */
export function pickStroke(rows: { id: string; hanzi: string }[], has: (char: string) => boolean = hasStroke): { char: string; itemId: string } | null {
  for (const row of rows) {
    const chars = [...row.hanzi];
    if (chars.length === 1 && chars[0] && has(chars[0])) return { char: chars[0], itemId: row.id };
  }
  for (const row of rows) {
    for (const char of [...row.hanzi]) {
      if (has(char)) return { char, itemId: row.id };
    }
  }
  return null;
}
