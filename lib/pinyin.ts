const MARKS: Record<string, string[]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

/** Tone mark on a or e, otherwise o, otherwise the last vowel. `v` is `ü`. Tone 5 is unmarked. */
export function markSyllable(numbered: string): string {
  const tone = Number(numbered.slice(-1));
  const body = numbered.slice(0, -1).replaceAll("v", "ü");
  if (tone === 5 || tone < 1 || tone > 4) return body;
  let pos = body.indexOf("a");
  if (pos < 0) pos = body.indexOf("e");
  if (pos < 0) pos = body.indexOf("o");
  if (pos < 0) {
    for (let i = body.length - 1; i >= 0; i -= 1) {
      if (body[i] === "ü" || body[i] === "u" || body[i] === "i") {
        pos = i;
        break;
      }
    }
  }
  const vowel = pos >= 0 ? body[pos] : "";
  const marked = vowel ? MARKS[vowel]?.[tone - 1] : undefined;
  if (!marked || pos < 0) return body;
  return body.slice(0, pos) + marked + body.slice(pos + 1);
}

export function markPinyin(numbered: string): string {
  return numbered.replace(/[a-z]+[1-5]/g, (syllable) => markSyllable(syllable));
}

/** Same syllables, first syllable moved to `tone`. */
export function withFirstTone(numbered: string, tone: number): string {
  return numbered.replace(/[a-z]+[1-5]/, (syllable) => `${syllable.slice(0, -1)}${tone}`);
}

export function firstNumberedTone(numbered: string): number | null {
  const match = numbered.match(/[a-z]+([1-5])/);
  return match ? Number(match[1]) : null;
}
