import assert from "node:assert/strict";
import test from "node:test";
import { freshCard, gradedItemIds, lessonRatings, practiceRating, rateCard } from "./srs";
import { Rating } from "ts-fsrs";

test("practice auto-rates by the clock", () => {
  assert.equal(practiceRating(false, 1, 5), Rating.Again);
  assert.equal(practiceRating(true, 9, 5), Rating.Hard);
  assert.equal(practiceRating(true, 8, 5), Rating.Hard);
  assert.equal(practiceRating(true, 5, 0), Rating.Good);
  assert.equal(practiceRating(true, 3, 1), Rating.Good);
  assert.equal(practiceRating(true, 3, 2), Rating.Easy);
});

test("Good schedules later than Again, and two Goods match", () => {
  const now = new Date("2026-10-09T12:00:00Z");
  const card = freshCard("hsk1-w072", "meaning", "2026-10-09", now);
  const good = rateCard(card, Rating.Good, now);
  const again = rateCard(card, Rating.Again, now);
  assert.ok(new Date(good.due).getTime() > new Date(again.due).getTime());
  const at = new Date(good.due);
  assert.equal(rateCard(good, Rating.Good, at).due, rateCard(good, Rating.Good, at).due);
});

test("a stroke or radical miss marks that word, and a match covers every pair", () => {
  assert.deepEqual(gradedItemIds({ type: "stroke", itemId: "hsk1-w072" }), ["hsk1-w072"]);
  assert.deepEqual(gradedItemIds({ type: "radical", itemId: "hsk1-w035" }), ["hsk1-w035"]);
  assert.deepEqual(gradedItemIds({ type: "match", itemIds: ["a", "b"] }), ["a", "b"]);
  assert.deepEqual(gradedItemIds({ type: "build" }), []);
  assert.deepEqual(
    lessonRatings([
      { itemId: "hsk1-w072", ok: false },
      { itemId: "hsk1-w072", ok: true },
    ]).map((row) => row.rating),
    [1, 2],
  );
});
