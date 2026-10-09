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
