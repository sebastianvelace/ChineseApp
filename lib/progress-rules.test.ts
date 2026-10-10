import assert from "node:assert/strict";
import test from "node:test";
import { answerCard, daysThatCount, emptyProgress, localDay, passNode, type ProgressState } from "./progress-rules";
import { freshCard } from "./srs";
import { Rating } from "ts-fsrs";

const words = ["hsk1-w072", "hsk1-w035", "hsk1-w111", "hsk1-w095"];

function on(day: number, month = 10): Date {
  return new Date(2026, month - 1, day, 12);
}

function lesson(state: ProgressState, id: string, when: Date, correct = 4): ProgressState {
  return passNode(
    state,
    id,
    "lesson",
    { ratio: 1, correct, itemIds: words, ratings: words.map((itemId) => ({ itemId, rating: 3 as const })) },
    when,
  );
}

test("passing lesson 1 creates 12 cards, 12 lesson reviews, and marks the words seen", () => {
  const state = lesson(emptyProgress(), "hsk1-u01-l1", on(1));
  assert.equal(state.cards.length, 12);
  assert.equal(new Set(state.cards.map((card) => card.cardType)).size, 3);
  assert.deepEqual(state.seen.map((row) => row.id), words);
  assert.equal(state.reviews.length, 12);
  assert.equal(state.reviews.every((row) => row.source === "lesson"), true);
  assert.equal(state.xpEvents[0]?.id, "lesson:hsk1-u01-l1");
  assert.equal(state.xpEvents[0]?.amount, 28);
  assert.equal(state.streakBurst, 1);
});

test("a later try on the same word is stored as its own reviews", () => {
  let state = passNode(
    emptyProgress(),
    "hsk1-u01-l1",
    "lesson",
    {
      ratio: 0.9,
      correct: 1,
      itemIds: ["hsk1-w072"],
      ratings: [
        { itemId: "hsk1-w072", rating: 1 },
        { itemId: "hsk1-w072", rating: 2 },
      ],
    },
    on(1),
  );
  assert.deepEqual(
    state.reviews.map((row) => row.rating),
    [1, 1, 1, 2, 2, 2],
  );
  assert.equal(state.cards.find((card) => card.cardType === "meaning")?.reps, 2);
  state = passNode(state, "hsk1-u01-l1", "lesson", { ratio: 1, correct: 1, itemIds: ["hsk1-w072"], ratings: [{ itemId: "hsk1-w072", rating: 3 }] }, on(1));
  assert.equal(state.reviews.length, 6);
  assert.equal(state.cards.find((card) => card.cardType === "meaning")?.reps, 2);
});

test("a second pass the same day grants replay XP once and does not rate again", () => {
  let state = lesson(emptyProgress(), "hsk1-u01-l1", on(1));
  state = lesson(state, "hsk1-u01-l1", on(1));
  assert.equal(state.xpEvents.reduce((sum, event) => sum + event.amount, 0), 33);
  assert.equal(state.xpEvents[1]?.id, `lesson-replay:hsk1-u01-l1:${localDay(on(1))}`);
  state = lesson(state, "hsk1-u01-l1", on(1));
  assert.equal(state.xpEvents.length, 2);
  assert.equal(state.reviews.length, 12);
  assert.equal(state.cards.length, 12);
  assert.equal(state.streak.current, 1);
});

test("two lessons on the same day do not raise the streak twice", () => {
  let state = lesson(emptyProgress(), "hsk1-u01-l1", on(1));
  state = passNode(state, "hsk1-u01-l2", "lesson", { ratio: 1, correct: 4, itemIds: ["e", "f", "g", "h"] }, on(1));
  assert.equal(state.streak.current, 1);
  assert.equal(state.streakBurst, null);
});

test("a freeze is granted at streak 7 and a missed day spends one", () => {
  let state = emptyProgress();
  for (let day = 1; day <= 7; day += 1) state = passNode(state, `talk-${day}`, "talk", undefined, on(day));
  assert.equal(state.streak.current, 7);
  assert.equal(state.streak.freezes, 1);
  state = passNode(state, "after-gap", "talk", undefined, on(9));
  assert.equal(state.streak.current, 8);
  assert.equal(state.streak.freezes, 0);
  assert.equal(state.streak.freezeNotice, localDay(on(9)));
});

test("freezes never go past 2", () => {
  let state = emptyProgress();
  state = {
    ...state,
    streak: { current: 29, longest: 29, lastActive: localDay(on(1)), freezes: 2, granted: [7, 14], freezeNotice: null, activeDays: [localDay(on(1))] },
  };
  state = passNode(state, "day-30", "talk", undefined, on(2));
  assert.equal(state.streak.current, 30);
  assert.equal(state.streak.freezes, 2);
});

test("practice counts toward the streak only after the daily goal", () => {
  const now = on(1);
  const card = freshCard("hsk1-w072", "meaning", localDay(now), now);
  let state = { ...emptyProgress(), cards: [card] };
  state = answerCard(state, card, Rating.Good, { id: "review-1", sessionId: "session" }, now);
  assert.equal(state.streak.current, 0);
  state = answerCard(state, card, Rating.Good, { id: "review-1", sessionId: "session" }, now);
  assert.equal(state.reviews.length, 1);
  assert.equal(state.xpEvents.length, 1);
  for (let n = 2; n <= 10; n += 1) {
    state = answerCard(state, state.cards[0] ?? card, Rating.Good, { id: `review-${n}`, sessionId: "session" }, now);
  }
  assert.equal(state.xpEvents.length, 10);
  assert.equal(state.streak.current, 1);
  assert.deepEqual(daysThatCount(state), [localDay(now)]);
});

test("gloss-only support is seen and does not get cards", () => {
  const state = passNode(
    emptyProgress(),
    "ev-u06-l3",
    "lesson",
    {
      ratio: 1,
      correct: 1,
      itemIds: ["sup-ba", "sup-men5"],
      ratings: [
        { itemId: "sup-ba", rating: 3 },
        { itemId: "sup-men5", rating: 1 },
      ],
    },
    on(1),
  );
  assert.deepEqual(state.seen.map((row) => row.id), ["sup-ba", "sup-men5"]);
  assert.deepEqual([...new Set(state.cards.map((card) => card.itemId))], ["sup-ba"]);
  assert.equal(state.reviews.every((row) => row.itemId === "sup-ba"), true);
});

test("one practice point does not fill the week", () => {
  const now = on(1);
  const card = freshCard("hsk1-w072", "meaning", localDay(now), now);
  const state = answerCard({ ...emptyProgress(), cards: [card] }, card, Rating.Good, { id: "review-1", sessionId: "session" }, now);
  assert.equal(state.xpEvents[0]?.amount, 1);
  assert.deepEqual(daysThatCount(state), []);
  const passed = lesson(emptyProgress(), "hsk1-u01-l1", now);
  assert.ok(daysThatCount(passed).includes(localDay(now)));
});
