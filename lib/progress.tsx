"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadDeviceProgress, saveDeviceProgress } from "./device-store";
import { type SeenStamp } from "./practice-queue";
import {
  addDays,
  answerCard as recordAnswer,
  dismissFreezeNotice,
  emptyProgress,
  localDay,
  localDayFromIso,
  passNode as recordPass,
  daysThatCount,
  xpOnDay,
  type Locale,
  type PassKind,
  type Passed,
  type ProgressState,
} from "./progress-rules";
import { type LessonRating, type SavedCard } from "./srs";
import { type Grade } from "ts-fsrs";

export type { Locale };

type ProgressApi = {
  ready: boolean;
  onboarded: boolean;
  locale: Locale;
  pinyin: boolean;
  dailyGoal: 10 | 20 | 50;
  track: "hsk" | "everyday";
  seen: Set<string>;
  seenItems: SeenStamp[];
  passed: Record<string, Passed>;
  xp: number;
  xpToday: number;
  streak: number;
  freezes: number;
  freezeNotice: boolean;
  streakBurst: number | null;
  cards: SavedCard[];
  activeDays: string[];
  weekDates: string[];
  completeOnboarding: (locale: Locale, pinyin: boolean) => void;
  setLocale: (locale: Locale) => void;
  setPinyin: (pinyin: boolean) => void;
  setGoal: (goal: 10 | 20 | 50) => void;
  setTrack: (track: "hsk" | "everyday") => void;
  dismissFreezeNotice: () => void;
  passNode: (nodeId: string, kind: PassKind, info?: { ratio: number; correct: number; itemIds: string[]; ratings?: LessonRating[] }) => void;
  answerCard: (card: SavedCard, rating: Grade, review: { id: string; sessionId: string }) => void;
};

const ProgressContext = createContext<ProgressApi | null>(null);

function normalize(saved: Partial<ProgressState> | null): ProgressState {
  const base = emptyProgress();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    seen: saved.seen ?? [],
    passed: saved.passed ?? {},
    xpEvents: saved.xpEvents ?? [],
    cards: saved.cards ?? [],
    reviews: saved.reviews ?? [],
    streak: { ...base.streak, ...saved.streak, freezeNotice: saved.streak?.freezeNotice ?? null, activeDays: saved.streak?.activeDays ?? [] },
    streakBurst: saved.streakBurst ?? null,
  };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProgressState | null>(null);
  const [day, setDay] = useState("1970-01-01");

  useEffect(() => {
    setDay(localDay(new Date()));
    let cancelled = false;
    loadDeviceProgress<ProgressState>()
      .then((saved) => {
        if (!cancelled) setData(normalize(saved));
      })
      .catch(() => {
        if (!cancelled) setData(emptyProgress());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (data) void saveDeviceProgress(data);
  }, [data]);

  const api = useMemo<ProgressApi>(() => {
    const current = data ?? emptyProgress();
    const seen = new Set(current.seen.map((row) => row.id));
    const xp = current.xpEvents.reduce((sum, event) => sum + event.amount, 0);
    const xpToday = xpOnDay(current.xpEvents, day);
    const activeDays = daysThatCount(current);
    const weekDates = [6, 5, 4, 3, 2, 1, 0].map((offset) => addDays(day, -offset));
    return {
      ready: data !== null,
      onboarded: current.onboarded,
      locale: current.locale,
      pinyin: current.pinyin,
      dailyGoal: current.dailyGoal,
      track: current.track,
      seen,
      seenItems: current.seen.map((row) => ({ id: row.id, at: row.at })),
      passed: current.passed,
      xp,
      xpToday,
      streak: current.streak.current,
      freezes: current.streak.freezes,
      freezeNotice: current.streak.freezeNotice === day,
      streakBurst: current.streakBurst,
      cards: current.cards,
      activeDays,
      weekDates,
      completeOnboarding: (locale, pinyin) => setData((prev) => ({ ...normalize(prev), onboarded: true, locale, pinyin })),
      setLocale: (locale) => setData((prev) => ({ ...normalize(prev), locale })),
      setPinyin: (pinyin) => setData((prev) => ({ ...normalize(prev), pinyin })),
      setGoal: (dailyGoal) => setData((prev) => ({ ...normalize(prev), dailyGoal })),
      setTrack: (track) => setData((prev) => ({ ...normalize(prev), track })),
      dismissFreezeNotice: () => setData((prev) => dismissFreezeNotice(normalize(prev))),
      passNode: (nodeId, kind, info) => setData((prev) => recordPass(normalize(prev), nodeId, kind, info, new Date())),
      answerCard: (card, rating, review) => setData((prev) => recordAnswer(normalize(prev), card, rating, review, new Date())),
    };
  }, [data, day]);

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress outside provider");
  return ctx;
}
