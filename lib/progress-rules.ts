import { deferExtraNewCards } from "./practice-queue";
import { applyLessonRatings, cardKey, freshCard, rateCard, type CardType, type LessonRating, type SavedCard } from "./srs";
import type { Grade } from "ts-fsrs";

export type Locale = "en" | "es";
export type XpEvent = { id: string; amount: number; at: string };
export type Passed = { ratio: number | null; at: string };
export type ReviewRow = { id: string; itemId: string; cardType: CardType; rating: number; at: string; source: "lesson" | "practice" };
export type Streak = { current: number; longest: number; lastActive: string | null; freezes: number; granted: number[]; freezeNotice: string | null };

export type ProgressState = {
  onboarded: boolean;
  locale: Locale;
  pinyin: boolean;
  dailyGoal: 10 | 20 | 50;
  track: "hsk" | "everyday";
  seen: { id: string; at: string; nodeId: string }[];
  passed: Record<string, Passed>;
  xpEvents: XpEvent[];
  cards: SavedCard[];
  reviews: ReviewRow[];
  streak: Streak;
  streakBurst: number | null;
};

export type PassKind = "lesson" | "review" | "talk";

export function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function localDayFromIso(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return localDay(parsed);
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return localDay(date);
}

export function emptyProgress(): ProgressState {
  return {
    onboarded: false,
    locale: "en",
    pinyin: true,
    dailyGoal: 10,
    track: "hsk",
    seen: [],
    passed: {},
    xpEvents: [],
    cards: [],
    reviews: [],
    streak: { current: 0, longest: 0, lastActive: null, freezes: 0, granted: [], freezeNotice: null },
    streakBurst: null,
  };
}

export function xpOnDay(events: XpEvent[], day: string): number {
  return events.filter((event) => localDayFromIso(event.at) === day).reduce((sum, event) => sum + event.amount, 0);
}

function bumpStreak(streak: Streak, day: string): Streak {
  if (streak.lastActive === day) return streak;
  let current = 1;
  let freezes = streak.freezes;
  let freezeNotice = streak.freezeNotice;
  if (streak.lastActive === null) current = 1;
  else if (streak.lastActive === addDays(day, -1)) current = streak.current + 1;
  else if (streak.lastActive === addDays(day, -2) && freezes > 0) {
    freezes -= 1;
    current = streak.current + 1;
    freezeNotice = day;
  }
  const granted = [...streak.granted];
  for (const mark of [7, 14, 30]) {
    if (current >= mark && !granted.includes(mark) && freezes < 2) {
      freezes += 1;
      granted.push(mark);
    }
  }
  return { current, longest: Math.max(streak.longest, current), lastActive: day, freezes, granted, freezeNotice };
}

function ensureCards(cards: SavedCard[], itemIds: string[], day: string, now: Date): SavedCard[] {
  const next = [...cards];
  const have = new Set(next.map(cardKey));
  for (const itemId of itemIds) {
    for (const cardType of ["meaning", "pinyin", "hanzi"] as CardType[]) {
      const key = `${itemId}:${cardType}`;
      if (have.has(key)) continue;
      next.push(freshCard(itemId, cardType, day, now));
      have.add(key);
    }
  }
  return next;
}

function lessonReviewRows(nodeId: string, ratings: LessonRating[], at: string, existing: ReviewRow[]): ReviewRow[] {
  const have = new Set(existing.map((row) => row.id));
  const added: ReviewRow[] = [];
  for (const rating of ratings) {
    for (const cardType of ["meaning", "pinyin", "hanzi"] as CardType[]) {
      const id = `lesson:${nodeId}:${rating.itemId}:${cardType}`;
      if (have.has(id)) continue;
      added.push({ id, itemId: rating.itemId, cardType, rating: rating.rating, at, source: "lesson" });
      have.add(id);
    }
  }
  return added;
}

export function passNode(
  state: ProgressState,
  nodeId: string,
  kind: PassKind,
  info: { ratio: number; correct: number; itemIds: string[]; ratings?: LessonRating[] } | undefined,
  now: Date,
): ProgressState {
  const dayNow = localDay(now);
  const already = state.passed[nodeId];
  const eventId = already ? `${kind}-replay:${nodeId}:${dayNow}` : `${kind}:${nodeId}`;
  let amount = 0;
  if (!state.xpEvents.some((event) => event.id === eventId)) {
    if (!already) amount = kind === "lesson" ? 20 + 2 * (info?.correct ?? 0) : kind === "review" ? 15 : 10;
    else if (kind === "lesson") amount = 5;
  }
  const xpEvents = amount ? [...state.xpEvents, { id: eventId, amount, at: now.toISOString() }] : state.xpEvents;
  const passed = { ...state.passed, [nodeId]: { ratio: info?.ratio ?? 1, at: already?.at ?? now.toISOString() } };
  const seen = [...state.seen];
  const seenIds = new Set(seen.map((row) => row.id));
  for (const id of info?.itemIds ?? []) {
    if (!seenIds.has(id)) {
      seen.push({ id, at: now.toISOString(), nodeId });
      seenIds.add(id);
    }
  }
  let cards = state.cards;
  let reviews = state.reviews;
  if (kind === "lesson" && info) {
    cards = ensureCards(cards, info.itemIds, dayNow, now);
    if (!already && info.ratings?.length) {
      cards = applyLessonRatings(cards, info.ratings);
      reviews = [...reviews, ...lessonReviewRows(nodeId, info.ratings, now.toISOString(), reviews)];
    }
    cards = deferExtraNewCards(cards, seen, dayNow);
  }
  const streak = bumpStreak(state.streak, dayNow);
  const streakBurst = streak.lastActive === dayNow && state.streak.lastActive !== dayNow ? streak.current : null;
  return { ...state, xpEvents, passed, seen, cards, reviews, streak, streakBurst };
}

export function answerCard(
  state: ProgressState,
  card: SavedCard,
  rating: Grade,
  review: { id: string; sessionId: string },
  now: Date,
): ProgressState {
  if (state.reviews.some((row) => row.id === review.id)) return state;
  const dayNow = localDay(now);
  const nextCard = rateCard(card, rating, now);
  const cards = state.cards.map((saved) => (cardKey(saved) === cardKey(card) ? nextCard : saved));
  const sessionCount = state.xpEvents.filter((event) => event.id.startsWith(`practice:${review.sessionId}:`)).length;
  const xpEvents =
    sessionCount >= 20 ? state.xpEvents : [...state.xpEvents, { id: `practice:${review.sessionId}:${review.id}`, amount: 1, at: now.toISOString() }];
  const streak = xpOnDay(xpEvents, dayNow) >= state.dailyGoal ? bumpStreak(state.streak, dayNow) : state.streak;
  return {
    ...state,
    cards,
    xpEvents,
    streak,
    reviews: [...state.reviews, { id: review.id, itemId: card.itemId, cardType: card.cardType, rating, at: now.toISOString(), source: "practice" }],
  };
}

export function dismissFreezeNotice(state: ProgressState): ProgressState {
  return { ...state, streak: { ...state.streak, freezeNotice: null } };
}
