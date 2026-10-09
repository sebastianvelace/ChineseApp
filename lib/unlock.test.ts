import assert from "node:assert/strict";
import test from "node:test";
import { trackById } from "./content";
import { resumeTarget } from "./unlock";

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

test("the culture note is next only after the track lessons are done", () => {
  const passed: Record<string, unknown> = {};
  for (const unit of units) for (const lesson of unit.lessons) passed[lesson.id] = { at: "t" };
  assert.equal(resumeTarget(units, passed)?.href, "/talk/hsk1-u01-tt");
});
