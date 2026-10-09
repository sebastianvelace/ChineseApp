import assert from "node:assert/strict";
import test from "node:test";
import { lessonPassed } from "./lesson-score";

test("a lesson passes at 80 percent of first tries", () => {
  assert.equal(lessonPassed(12, 15), true);
  assert.equal(lessonPassed(11, 15), false);
  assert.equal(lessonPassed(0, 15), false);
  assert.equal(lessonPassed(4, 5), true);
  assert.equal(lessonPassed(0, 0), true);
});
