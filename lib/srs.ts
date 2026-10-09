import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";

export type CardType = "meaning" | "pinyin" | "hanzi";

export type SavedCard = {
  itemId: string;
  cardType: CardType;
  introducedOn: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
};

const scheduler = fsrs({ request_retention: 0.9, enable_fuzz: false });

export function cardKey(card: Pick<SavedCard, "itemId" | "cardType">): string {
  return `${card.itemId}:${card.cardType}`;
}

function toCard(saved: SavedCard): Card {
  return {
    due: new Date(saved.due),
    stability: saved.stability,
    difficulty: saved.difficulty,
    elapsed_days: saved.elapsed_days,
    scheduled_days: saved.scheduled_days,
    learning_steps: saved.learning_steps,
    reps: saved.reps,
    lapses: saved.lapses,
    state: saved.state,
    last_review: saved.last_review ? new Date(saved.last_review) : undefined,
  };
}

function fromCard(saved: SavedCard, card: Card): SavedCard {
  return {
    ...saved,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

export function freshCard(itemId: string, cardType: CardType, introducedOn: string, due: Date): SavedCard {
  const card = createEmptyCard(due);
  card.due = due;
  return fromCard({ itemId, cardType, introducedOn, due: due.toISOString(), stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: 0, lapses: 0, state: 0, last_review: null }, card);
}

export function practiceRating(ok: boolean, seconds: number, reps: number): Grade {
  if (!ok) return Rating.Again;
  if (seconds < 4 && reps >= 2) return Rating.Easy;
  if (seconds < 8) return Rating.Good;
  return Rating.Hard;
}

export function rateCard(saved: SavedCard, rating: Grade, now = new Date()): SavedCard {
  const next = scheduler.next(toCard(saved), now, rating);
  return fromCard(saved, next.card);
}

export type LessonRating = { itemId: string; rating: 1 | 2 | 3 };

export function lessonRatings(outcomes: { itemId: string; ok: boolean }[]): LessonRating[] {
  const missed = new Set(outcomes.filter((row) => !row.ok).map((row) => row.itemId));
  return outcomes.map((row) => ({
    itemId: row.itemId,
    rating: !row.ok ? 1 : missed.has(row.itemId) ? 2 : 3,
  }));
}

export function applyLessonRatings(cards: SavedCard[], ratings: LessonRating[]): SavedCard[] {
  let next = cards;
  for (const row of ratings) {
    const grade = row.rating === 1 ? 1 : row.rating === 2 ? 2 : 3;
    next = next.map((card) => (card.itemId === row.itemId ? rateCard(card, grade as Grade) : card));
  }
  return next;
}

export function isDue(saved: SavedCard, now?: Date): boolean {
  const at = now ?? new Date();
  return new Date(saved.due).getTime() <= at.getTime();
}
