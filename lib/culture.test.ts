import assert from "node:assert/strict";
import test from "node:test";
import { dailyCultureFact } from "./culture";

test("daily culture facts are stable within a day", () => {
  const morning = dailyCultureFact(new Date("2026-10-13T08:00:00-05:00"));
  const evening = dailyCultureFact(new Date("2026-10-13T20:00:00-05:00"));
  assert.equal(morning.id, evening.id);
});

test("daily culture facts rotate through the collection", () => {
  const first = dailyCultureFact(new Date("2026-10-13T12:00:00Z"));
  const next = dailyCultureFact(new Date("2026-10-14T12:00:00Z"));
  assert.notEqual(first.id, next.id);
});
