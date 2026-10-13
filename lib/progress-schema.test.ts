import assert from "node:assert/strict";
import test from "node:test";
import { emptyProgress } from "./progress-rules";
import { normalizeProgress, parseProgressExport, serializeProgress } from "./progress-schema";

test("progress export round-trips the current schema", () => {
  const progress = emptyProgress();
  progress.onboarded = true;
  progress.locale = "es";
  const parsed = parseProgressExport(serializeProgress(progress, "2026-10-13T00:00:00.000Z"));
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.deepEqual(parsed.data, progress);
});

test("unversioned progress migrates with safe defaults", () => {
  const migrated = normalizeProgress({ onboarded: true, dailyGoal: 50, streak: { current: 3, activeDays: ["2026-10-13"] } });
  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.onboarded, true);
  assert.equal(migrated.dailyGoal, 50);
  assert.equal(migrated.streak.current, 3);
  assert.deepEqual(migrated.streak.activeDays, ["2026-10-13"]);
});

test("future export versions are rejected", () => {
  const result = parseProgressExport(JSON.stringify({ format: "hanlu-progress", version: 999, progress: {} }));
  assert.deepEqual(result, { ok: false, reason: "future-version" });
});
