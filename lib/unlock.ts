import { getLearnable, getUnit } from "./content";
import type { Lesson, Unit } from "./types";

export type Resume = {
  href: string;
  kind: "lesson" | "talk" | "review";
  order?: number;
  hanzi: string;
};

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

function hanziList(ids: string[]): string {
  return ids.map((id) => getLearnable(id)?.hanzi).filter(Boolean).join("、");
}

function lessonResume(unit: Unit, lesson: Lesson): Resume {
  return {
    href: `/lesson/${lesson.id}`,
    kind: "lesson",
    order: lesson.order,
    hanzi: hanziList([...lesson.targetWordIds, ...lesson.supportTargetIds]),
  };
}

export function resumeTarget(units: Unit[], passed: Record<string, unknown>): Resume | null {
  const open: Unit[] = [];
  for (const unit of units) {
    if (!unitUnlocked(unit, passed)) break;
    open.push(unit);
    for (const lesson of unit.lessons) {
      if (lessonStatus(unit, lesson, passed) === "available") return lessonResume(unit, lesson);
    }
  }
  for (const unit of open) {
    if (extraStatus(unit, unit.teacherTalk.id, passed) === "available") {
      return { href: `/talk/${unit.teacherTalk.id}`, kind: "talk", hanzi: "" };
    }
    if (extraStatus(unit, unit.review.id, passed) === "available") {
      return { href: `/lesson/${unit.review.id}`, kind: "review", hanzi: "" };
    }
  }
  return null;
}

export function resumeHref(units: Unit[], passed: Record<string, unknown>): string | null {
  return resumeTarget(units, passed)?.href ?? null;
}

export function unitState(unit: Unit, passed: Record<string, unknown>): "locked" | "current" | "done" {
  if (!unitUnlocked(unit, passed)) return "locked";
  if (unit.lessons.every((lesson) => passed[lesson.id])) return "done";
  return "current";
}
