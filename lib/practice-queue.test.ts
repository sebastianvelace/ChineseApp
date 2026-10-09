import assert from "node:assert/strict";
import test from "node:test";
import { deferExtraNewCards, localDay, nextMorning, practiceQueue, rankNewCards } from "./practice-queue";
import type { CardType, SavedCard } from "./srs";

const now = new Date(2026, 9, 9, 15, 0, 0);
const day = localDay(now);

function card(itemId: string, cardType: CardType, introducedOn: string, due = now.toISOString()): SavedCard {
  return {
    itemId,
    cardType,
    introducedOn,
    due,
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: 0,
    lapses: 0,
    state: 1,
    last_review: null,
  };
}

function pack(ids: string[], introducedOn: string): SavedCard[] {
  const types: CardType[] = ["meaning", "pinyin", "hanzi"];
  return ids.flatMap((id) => types.map((cardType) => card(id, cardType, introducedOn)));
}

test("practice keeps ten new cards, oldest word first, then shows them by card type", () => {
  const ids = ["w1", "w2", "w3", "w4", "w5"];
  const seen = ids.map((id, index) => ({ id, at: `2026-10-09T10:00:0${index}.000Z` }));
  const queue = practiceQueue(pack(ids, day), seen, now);
  assert.equal(queue.length, 10);
  assert.deepEqual(
    queue.map((row) => `${row.itemId}:${row.cardType}`),
    [
      "w1:meaning",
      "w2:meaning",
      "w3:meaning",
      "w4:meaning",
      "w1:pinyin",
      "w2:pinyin",
      "w3:pinyin",
      "w1:hanzi",
      "w2:hanzi",
      "w3:hanzi",
    ],
  );
});

test("same seen time fills from the seen list, meaning then pinyin then hanzi", () => {
  const seen = [
    { id: "b", at: "2026-10-09T10:00:00.000Z" },
    { id: "a", at: "2026-10-09T10:00:00.000Z" },
  ];
  const ranked = rankNewCards([...pack(["a"], day), ...pack(["b"], day)], seen);
  assert.deepEqual(
    ranked.map((row) => `${row.itemId}:${row.cardType}`),
    ["b:meaning", "b:pinyin", "b:hanzi", "a:meaning", "a:pinyin", "a:hanzi"],
  );
});

test("due reviews stay in the session and new cards still stop at ten", () => {
  const ids = ["n1", "n2", "n3", "n4"];
  const seen = [...ids, "o1", "o2", "o3", "o4", "o5"].map((id, index) => ({ id, at: `2026-10-09T10:00:0${index}.000Z` }));
  const older = ["o1", "o2", "o3", "o4", "o5"].map((id) => card(id, "meaning", "2026-10-08"));
  const queue = practiceQueue([...older, ...pack(ids, day)], seen, now);
  assert.equal(queue.length, 15);
  assert.equal(queue.filter((row) => row.introducedOn === "2026-10-08").length, 5);
  assert.equal(queue.filter((row) => row.introducedOn === day).length, 10);
});

test("a session never holds more than twenty due reviews", () => {
  const older = Array.from({ length: 25 }, (_, index) => card(`o${index}`, "meaning", "2026-10-01"));
  const seen = older.map((row) => ({ id: row.itemId, at: "2026-10-01T00:00:00.000Z" }));
  assert.equal(practiceQueue(older, seen, now).length, 20);
});

test("a due card for a word the learner has not passed stays out", () => {
  const seen = [{ id: "ni", at: "2026-10-09T10:00:00.000Z" }];
  const queue = practiceQueue([card("ni", "meaning", day), card("ta", "meaning", day)], seen, now);
  assert.deepEqual(queue.map((row) => row.itemId), ["ni"]);
});

test("cards past the daily cap wait until 00:05 tomorrow", () => {
  const ids = ["w1", "w2", "w3", "w4"];
  const seen = ids.map((id, index) => ({ id, at: `2026-10-09T10:00:0${index}.000Z` }));
  const deferred = deferExtraNewCards(pack(ids, day), seen, day);
  const parked = deferred.filter((row) => row.due === nextMorning(day));
  assert.equal(parked.length, 2);
  assert.deepEqual(
    parked.map((row) => `${row.itemId}:${row.cardType}`),
    ["w4:pinyin", "w4:hanzi"],
  );
  const morning = new Date(nextMorning(day));
  assert.equal(morning.getHours(), 0);
  assert.equal(morning.getMinutes(), 5);
  assert.equal(practiceQueue(deferred, seen, now).length, 10);
});
