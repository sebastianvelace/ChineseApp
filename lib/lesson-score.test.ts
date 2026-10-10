import assert from "node:assert/strict";
import test from "node:test";
import { buildMatches, lessonPassed } from "./lesson-score";

test("a lesson passes at 80 percent of first tries", () => {
  assert.equal(lessonPassed(12, 15), true);
  assert.equal(lessonPassed(11, 15), false);
  assert.equal(lessonPassed(0, 15), false);
  assert.equal(lessonPassed(4, 5), true);
  assert.equal(lessonPassed(0, 0), true);
});

test("identical sentence tiles can swap and still match", () => {
  const tokens = [{ text: "十" }, { text: "一" }, { text: "十" }];
  assert.equal(buildMatches(["0", "1", "2"], tokens), true);
  assert.equal(buildMatches(["2", "1", "0"], tokens), true);
  assert.equal(buildMatches(["1", "0", "2"], tokens), false);
});
