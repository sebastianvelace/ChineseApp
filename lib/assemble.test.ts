import assert from "node:assert/strict";
import test from "node:test";
import { assembleLesson } from "./assemble";
import { findLesson, getLearnable, getSentence } from "./content";

function hanzi(id: string): string {
  return getLearnable(id)?.hanzi ?? id;
}

test("lesson 1 is stable, teaches four words, and stays inside that set", () => {
  const first = assembleLesson("hsk1-u01-l1", [], "1.0.0");
  const second = assembleLesson("hsk1-u01-l1", [], "1.0.0");
  assert.deepEqual(first, second);
  const lesson = findLesson("hsk1-u01-l1")?.lesson;
  assert.ok(lesson);
  const allowed = new Set([...lesson.targetWordIds, ...lesson.supportTargetIds]);
  assert.deepEqual(
    first.filter((item) => item.type === "teach").map((item) => hanzi(item.itemId)),
    ["你", "好", "我", "是"],
  );
  for (const item of first) {
    if ("itemId" in item) assert.ok(allowed.has(item.itemId), item.itemId);
    if (item.type === "meaning") {
      for (const option of item.options) assert.ok(allowed.has(option), option);
    }
    if (item.type === "teach-set") {
      for (const id of item.itemIds) assert.ok(allowed.has(id));
    }
  }
  const ni = first.find((item) => item.type === "pinyin" && hanzi(item.itemId) === "你");
  assert.ok(ni && ni.type === "pinyin");
  assert.deepEqual([...ni.options].sort(), ["nì", "ní", "nī", "nǐ"]);
  assert.deepEqual(
    first.map((item) => item.type),
    [
      "teach",
      "teach",
      "teach",
      "teach",
      "meaning",
      "meaning",
      "meaning",
      "meaning",
      "pinyin",
      "pinyin",
      "pinyin",
      "pinyin",
      "tone",
      "tone",
      "build",
      "blank",
      "radical",
      "radical",
      "stroke",
    ],
  );
});

test("a seen word skips its teach card and its pinyin question", () => {
  const lesson = findLesson("hsk1-u01-l1")?.lesson;
  assert.ok(lesson);
  const seenId = lesson.targetWordIds[0] ?? "";
  const items = assembleLesson("hsk1-u01-l1", [seenId], "1.0.0");
  assert.equal(items.filter((item) => item.type === "teach").length, 3);
  assert.equal(items.some((item) => item.type === "teach" && item.itemId === seenId), false);
  assert.equal(items.some((item) => item.type === "pinyin" && item.itemId === seenId), false);
  assert.equal(items.some((item) => item.type === "meaning" && item.itemId === seenId), true);
});

test("the blank is the next sentence and its choices come from the lesson", () => {
  const lesson = findLesson("hsk1-u01-l1")?.lesson;
  assert.ok(lesson);
  const items = assembleLesson("hsk1-u01-l1", [], "1.0.0");
  const build = items.find((item) => item.type === "build");
  const blank = items.find((item) => item.type === "blank");
  assert.ok(build && build.type === "build");
  assert.ok(blank && blank.type === "blank");
  const buildIndex = lesson.sentenceIds.indexOf(build.sentenceId);
  const expectedBlank = lesson.sentenceIds[(buildIndex + 1) % lesson.sentenceIds.length];
  assert.equal(blank.sentenceId, expectedBlank);
  const sentence = getSentence(blank.sentenceId);
  assert.ok(sentence);
  const answer = sentence.tokens.filter((token) => token.kind !== "punct")[blank.blankAt]?.text;
  assert.ok(answer && blank.options.includes(answer));
  const pool = new Set<string>();
  for (const id of lesson.sentenceIds) {
    for (const token of getSentence(id)?.tokens ?? []) {
      if (token.kind !== "punct") pool.add(token.text);
    }
  }
  for (const id of lesson.targetWordIds) pool.add(getLearnable(id)?.hanzi ?? "");
  for (const option of blank.options) assert.ok(pool.has(option), option);
});

test("a number set is one teach card, with pinyin on 1, 3, 5, and the last", () => {
  const lesson = findLesson("hsk1-u04-l1")?.lesson;
  assert.ok(lesson);
  assert.equal(lesson.presentation, "set");
  const items = assembleLesson("hsk1-u04-l1", [], "1.0.0");
  assert.equal(items.filter((item) => item.type === "teach-set").length, 1);
  assert.equal(items.filter((item) => item.type === "teach").length, 0);
  assert.equal(items.some((item) => item.type === "blank" || item.type === "radical" || item.type === "stroke"), false);
  const targets = [...lesson.targetWordIds, ...lesson.supportTargetIds];
  const wanted = new Set([0, 2, 4, targets.length - 1].map((index) => targets[index]));
  const asked = items.filter((item) => item.type === "pinyin").map((item) => item.itemId);
  assert.deepEqual(asked, [...wanted]);
  const toneHanzi = items.filter((item) => item.type === "tone").map((item) => hanzi(item.itemId));
  assert.deepEqual(toneHanzi.filter((text) => ["一", "四", "十"].includes(text)), toneHanzi);
  assert.ok(toneHanzi.includes("一"));
  const build = items.find((item) => item.type === "build");
  assert.ok(build && build.type === "build");
});
