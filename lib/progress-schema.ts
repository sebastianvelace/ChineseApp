import { emptyProgress, PROGRESS_SCHEMA_VERSION, type ProgressState } from "./progress-rules";
import { type CardType, type SavedCard } from "./srs";

const FORMAT = "hanlu-progress";

export type ImportProgressResult =
  | { ok: true; data: ProgressState }
  | { ok: false; reason: "invalid" | "future-version" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeCards(value: unknown): SavedCard[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((card) => {
    const cardType = card.cardType;
    if (typeof card.itemId !== "string" || !["meaning", "pinyin", "hanzi"].includes(String(cardType))) return [];
    return [{
      itemId: card.itemId,
      cardType: cardType as CardType,
      introducedOn: stringValue(card.introducedOn, "1970-01-01"),
      due: stringValue(card.due, "1970-01-01"),
      stability: finiteNumber(card.stability, 0),
      difficulty: finiteNumber(card.difficulty, 0),
      elapsed_days: finiteNumber(card.elapsed_days, 0),
      scheduled_days: finiteNumber(card.scheduled_days, 0),
      learning_steps: finiteNumber(card.learning_steps, 0),
      reps: Math.max(0, Math.floor(finiteNumber(card.reps, 0))),
      lapses: Math.max(0, Math.floor(finiteNumber(card.lapses, 0))),
      state: finiteNumber(card.state, 0) as SavedCard["state"],
      last_review: typeof card.last_review === "string" ? card.last_review : null,
    }];
  });
}

export function normalizeProgress(value: unknown): ProgressState {
  const base = emptyProgress();
  if (!isRecord(value)) return base;
  const version = typeof value.schemaVersion === "number" ? value.schemaVersion : 0;
  if (!Number.isInteger(version) || version < 0 || version > PROGRESS_SCHEMA_VERSION) throw new Error("Unsupported progress version");
  const streak = isRecord(value.streak) ? value.streak : {};
  const locale = value.locale === "es" ? "es" : "en";
  const dailyGoal = value.dailyGoal === 20 || value.dailyGoal === 50 ? value.dailyGoal : 10;
  const track = value.track === "everyday" ? "everyday" : "hsk";
  const seen = Array.isArray(value.seen)
    ? value.seen.filter(isRecord).flatMap((row) => typeof row.id === "string" && typeof row.at === "string" && typeof row.nodeId === "string" ? [{ id: row.id, at: row.at, nodeId: row.nodeId }] : [])
    : [];
  const passed = isRecord(value.passed)
    ? Object.fromEntries(Object.entries(value.passed).flatMap(([id, row]) => {
        if (!isRecord(row) || typeof row.at !== "string") return [];
        return [[id, { ratio: typeof row.ratio === "number" && Number.isFinite(row.ratio) ? row.ratio : null, at: row.at }]];
      }))
    : {};
  const xpEvents = Array.isArray(value.xpEvents)
    ? value.xpEvents.filter(isRecord).flatMap((event) => typeof event.id === "string" && typeof event.at === "string" && typeof event.amount === "number" && Number.isFinite(event.amount) ? [{ id: event.id, amount: event.amount, at: event.at }] : [])
    : [];
  const reviews = Array.isArray(value.reviews)
    ? value.reviews.filter(isRecord).flatMap((row) => typeof row.id === "string" && typeof row.itemId === "string" && typeof row.cardType === "string" && typeof row.rating === "number" && typeof row.at === "string" && ["lesson", "review", "practice"].includes(row.source as string) ? [{ id: row.id, itemId: row.itemId, cardType: row.cardType as CardType, rating: row.rating, at: row.at, source: row.source as "lesson" | "review" | "practice" }] : [])
    : [];
  return {
    ...base,
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    onboarded: value.onboarded === true,
    locale,
    pinyin: value.pinyin !== false,
    dailyGoal,
    track,
    seen,
    passed,
    xpEvents,
    cards: normalizeCards(value.cards),
    reviews,
    streak: {
      current: Math.max(0, Math.floor(finiteNumber(streak.current, 0))),
      longest: Math.max(0, Math.floor(finiteNumber(streak.longest, 0))),
      lastActive: typeof streak.lastActive === "string" ? streak.lastActive : null,
      freezes: Math.max(0, Math.floor(finiteNumber(streak.freezes, 0))),
      granted: Array.isArray(streak.granted) ? streak.granted.filter((mark): mark is number => typeof mark === "number" && Number.isFinite(mark)) : [],
      freezeNotice: typeof streak.freezeNotice === "string" ? streak.freezeNotice : null,
      activeDays: Array.isArray(streak.activeDays) ? streak.activeDays.filter((day): day is string => typeof day === "string") : [],
    },
    streakBurst: typeof value.streakBurst === "number" && Number.isFinite(value.streakBurst) ? value.streakBurst : null,
  };
}

export function serializeProgress(value: ProgressState, exportedAt = new Date().toISOString()): string {
  return JSON.stringify({ format: FORMAT, version: PROGRESS_SCHEMA_VERSION, exportedAt, progress: normalizeProgress(value) }, null, 2);
}

export function parseProgressExport(raw: string): ImportProgressResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.format !== FORMAT || !("progress" in parsed)) return { ok: false, reason: "invalid" };
    if (parsed.version !== PROGRESS_SCHEMA_VERSION) return { ok: false, reason: typeof parsed.version === "number" && parsed.version > PROGRESS_SCHEMA_VERSION ? "future-version" : "invalid" };
    return { ok: true, data: normalizeProgress(parsed.progress) };
  } catch (error) {
    return { ok: false, reason: error instanceof Error && error.message.includes("Unsupported") ? "future-version" : "invalid" };
  }
}
