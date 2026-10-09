import { getUnit } from "./content";
import type { Lesson, Unit } from "./types";

export function unitUnlocked(unit: Unit, passed: Record<string, unknown>): boolean {
  if (!unit.requiresUnitId) return true;
  const previous = getUnit(unit.requiresUnitId);
  if (!previous) return true;
  return previous.lessons.every((lesson) => passed[lesson.id]);
}

export function lessonStatus(unit: Unit, lesson: Lesson, passed: Record<string, unknown>): "locked" | "available" | "passed" {
  if (passed[lesson.id]) return "passed";
  if (!unitUnlocked(unit, passed)) return "locked";
  if (lesson.order === 1) return "available";
  const previous = unit.lessons.find((item) => item.order === lesson.order - 1);
  return previous && passed[previous.id] ? "available" : "locked";
}

export function extraStatus(unit: Unit, nodeId: string, passed: Record<string, unknown>): "locked" | "available" | "passed" {
  if (passed[nodeId]) return "passed";
  const last = unit.lessons[unit.lessons.length - 1];
  return last && passed[last.id] ? "available" : "locked";
}

export function resumeHref(units: Unit[], passed: Record<string, unknown>): string | null {
  for (const unit of units) {
    if (!unitUnlocked(unit, passed)) return null;
    for (const lesson of unit.lessons) {
      if (lessonStatus(unit, lesson, passed) === "available") return `/lesson/${lesson.id}`;
    }
    if (extraStatus(unit, unit.teacherTalk.id, passed) === "available") return `/talk/${unit.teacherTalk.id}`;
    if (extraStatus(unit, unit.review.id, passed) === "available") return `/lesson/${unit.review.id}`;
  }
  return null;
}

export function unitState(unit: Unit, passed: Record<string, unknown>): "locked" | "current" | "done" {
  if (!unitUnlocked(unit, passed)) return "locked";
  if (unit.lessons.every((lesson) => passed[lesson.id])) return "done";
  return "current";
}
