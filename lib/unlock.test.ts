import assert from "node:assert/strict";
import test from "node:test";
import { getUnit, trackById } from "./content";
import { nextLessonStep, resumeTarget } from "./unlock";

const units = trackById("hsk")?.levels[0]?.units ?? [];

test("a new learner continues at the first lesson", () => {
  assert.equal(resumeTarget(units, {})?.href, "/lesson/hsk1-u01-l1");
});

test("finished lessons continue into the next unit before the culture note", () => {
  const passed: Record<string, unknown> = {};
  for (const lesson of units[0]?.lessons ?? []) passed[lesson.id] = { at: "t" };
  const next = resumeTarget(units, passed);
  assert.equal(next?.kind, "lesson");
  assert.equal(next?.href, "/lesson/hsk1-u02-l1");
});

test("the last lesson of a unit continues into the next unit's first lesson", () => {
  const unit = getUnit("hsk1-u01");
  assert.ok(unit);
  const step = nextLessonStep(unit, "hsk1-u01-l3", { "hsk1-u01-l1": true, "hsk1-u01-l2": true });
  assert.deepEqual(step, { href: "/lesson/hsk1-u02-l1", kind: "lesson" });
});

test("lesson 1 continues to lesson 2", () => {
  const unit = getUnit("hsk1-u01");
  assert.ok(unit);
  assert.equal(nextLessonStep(unit, "hsk1-u01-l1", {})?.href, "/lesson/hsk1-u01-l2");
});

test("the culture note is next only after the track lessons are done", () => {
  const passed: Record<string, unknown> = {};
  for (const unit of units) for (const lesson of unit.lessons) passed[lesson.id] = { at: "t" };
  assert.equal(resumeTarget(units, passed)?.href, "/talk/hsk1-u01-tt");
});
