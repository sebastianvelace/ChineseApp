import { cardKey, isDue, type CardType, type SavedCard } from "./srs";

export const NEW_CARD_CAP = 10;
export const SESSION_CAP = 20;

const TYPE_ORDER: CardType[] = ["meaning", "pinyin", "hanzi"];

export type SeenStamp = { id: string; at: string };

export function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 00:05 on the next local calendar day, stored as UTC. */
export function nextMorning(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + 1, 0, 5, 0, 0);
  return date.toISOString();
}

function seenIndex(seen: SeenStamp[]): Map<string, { at: string; index: number }> {
  return new Map(seen.map((row, index) => [row.id, { at: row.at, index }]));
}

function compareIntroduced(a: SavedCard, b: SavedCard, seen: Map<string, { at: string; index: number }>): number {
  const left = seen.get(a.itemId);
  const right = seen.get(b.itemId);
  const byTime = (left?.at ?? "\uffff").localeCompare(right?.at ?? "\uffff");
  if (byTime) return byTime;
  const byIndex = (left?.index ?? Number.MAX_SAFE_INTEGER) - (right?.index ?? Number.MAX_SAFE_INTEGER);
  if (byIndex) return byIndex;
  return TYPE_ORDER.indexOf(a.cardType) - TYPE_ORDER.indexOf(b.cardType);
}

export function rankNewCards(cards: SavedCard[], seen: SeenStamp[]): SavedCard[] {
  const index = seenIndex(seen);
  return [...cards].sort((a, b) => compareIntroduced(a, b, index));
}

/**
 * Lesson ratings schedule every new card within minutes. Keep the ten oldest
 * (by first-seen time, then meaning → pinyin → hanzi) and park the rest at
 * 00:05 tomorrow so Practice does not meet an 11th new card today.
 */
export function deferExtraNewCards(cards: SavedCard[], seen: SeenStamp[], day: string): SavedCard[] {
  const ranked = rankNewCards(cards.filter((card) => card.introducedOn === day), seen);
  const wait = new Set(ranked.slice(NEW_CARD_CAP).map(cardKey));
  if (wait.size === 0) return cards;
  const due = nextMorning(day);
  return cards.map((card) => (wait.has(cardKey(card)) ? { ...card, due } : card));
}

export function practiceQueue(cards: SavedCard[], seen: SeenStamp[], now = new Date()): SavedCard[] {
  const day = localDay(now);
  const seenIds = new Set(seen.map((row) => row.id));
  const due = cards.filter((card) => seenIds.has(card.itemId) && isDue(card, now));
  const introduced = due.filter((card) => card.introducedOn === day);
  const reviews = due.filter((card) => card.introducedOn !== day);
  const allowed = new Set(rankNewCards(introduced, seen).slice(0, NEW_CARD_CAP).map(cardKey));
  return [...reviews, ...introduced.filter((card) => allowed.has(cardKey(card)))]
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime() || TYPE_ORDER.indexOf(a.cardType) - TYPE_ORDER.indexOf(b.cardType))
    .slice(0, SESSION_CAP);
}
