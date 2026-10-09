/** First-try correct answers over planned graded items. Recycles are not included. */
export function lessonPassed(correct: number, graded: number): boolean {
  if (graded <= 0) return true;
  return correct / graded >= 0.8;
}
