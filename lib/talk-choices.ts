/** Trim and drop 。！？. Hanzi stays case-sensitive. */
export function normalizeTalkAnswer(value: string): string {
  return value.trim().replace(/[。！？]/g, "");
}

export function talkAnswerMatches(picked: string, answer: string): boolean {
  return normalizeTalkAnswer(picked) === normalizeTalkAnswer(answer);
}

/** Three talk buttons: this answer, the other check, one unit hanzi, then 是 / 不 / 好. */
export function talkChoices(answer: string, other: string | undefined, hanzi: string[]): string[] {
  const options = [answer];
  if (other && !options.includes(other)) options.push(other);
  const extra = hanzi.find((text) => text && !options.includes(text));
  if (extra) options.push(extra);
  for (const pad of ["是", "不", "好"]) {
    if (options.length >= 3) break;
    if (!options.includes(pad)) options.push(pad);
  }
  return options.slice(0, 3);
}
