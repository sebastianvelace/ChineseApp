/** Word ids in a sentence, once each, in token order. */
export function sentenceWordIds(tokens: readonly { wordId?: string; supportId?: string }[]): string[] {
  const ids: string[] = [];
  for (const token of tokens) {
    const id = token.wordId ?? token.supportId;
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Same characters in order. Two identical tiles can swap without failing. */
export function buildMatches(placed: readonly string[], tokens: readonly { text: string }[]): boolean {
  const placedText = placed.map((key) => tokens[Number(key)]?.text ?? "").join("");
  return placedText === tokens.map((token) => token.text).join("");
}

/** First-try correct answers over planned graded items. Recycles are not included. */
export function lessonPassed(correct: number, graded: number): boolean {
  if (graded <= 0) return true;
  return correct / graded >= 0.8;
}
