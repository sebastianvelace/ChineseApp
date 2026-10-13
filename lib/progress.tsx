"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearDeviceProgress, loadDeviceProgress, saveDeviceProgress } from "./device-store";
import { normalizeProgress, parseProgressExport, serializeProgress, type ImportProgressResult } from "./progress-schema";
import { type SeenStamp } from "./practice-queue";
import {
  addDays,
  answerCard as recordAnswer,
  dismissFreezeNotice,
  emptyProgress,
  localDay,
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
  saveError: boolean;
  dismissFreezeNotice: () => void;
  passNode: (nodeId: string, kind: PassKind, info?: { ratio: number; correct: number; itemIds: string[]; ratings?: LessonRating[] }) => void;
  answerCard: (card: SavedCard, rating: Grade, review: { id: string; sessionId: string }) => void;
  exportProgress: () => string;
  importProgress: (raw: string) => ImportProgressResult;
  resetProgress: () => Promise<boolean>;
};

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProgressState | null>(null);
  const [day, setDay] = useState("1970-01-01");
  const [persist, setPersist] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const syncDay = () => setDay(localDay(new Date()));
    syncDay();
    document.addEventListener("visibilitychange", syncDay);
    const timer = window.setInterval(syncDay, 60_000);
    let cancelled = false;
    loadDeviceProgress<ProgressState>()
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded.ok) {
          setPersist(false);
          setSaveError(true);
          setData(emptyProgress());
          return;
        }
        try {
          setPersist(true);
          setData(normalizeProgress(loaded.data));
        } catch {
          setPersist(false);
          setSaveError(true);
          setData(emptyProgress());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPersist(false);
          setSaveError(true);
          setData(emptyProgress());
        }
      });
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", syncDay);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!data || !persist) return;
    void saveDeviceProgress(data).then((ok) => setSaveError(!ok));
  }, [data, persist]);

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
      saveError,
      cards: current.cards,
      activeDays,
      weekDates,
      completeOnboarding: (locale, pinyin) => setData((prev) => ({ ...normalizeProgress(prev), onboarded: true, locale, pinyin })),
      setLocale: (locale) => setData((prev) => ({ ...normalizeProgress(prev), locale })),
      setPinyin: (pinyin) => setData((prev) => ({ ...normalizeProgress(prev), pinyin })),
      setGoal: (dailyGoal) => setData((prev) => ({ ...normalizeProgress(prev), dailyGoal })),
      setTrack: (track) => setData((prev) => ({ ...normalizeProgress(prev), track })),
      dismissFreezeNotice: () => setData((prev) => dismissFreezeNotice(normalizeProgress(prev))),
      passNode: (nodeId, kind, info) => setData((prev) => recordPass(normalizeProgress(prev), nodeId, kind, info, new Date())),
      answerCard: (card, rating, review) => setData((prev) => recordAnswer(normalizeProgress(prev), card, rating, review, new Date())),
      exportProgress: () => serializeProgress(current),
      importProgress: (raw) => {
        const result = parseProgressExport(raw);
        if (result.ok) {
          setData(result.data);
          setPersist(true);
          setSaveError(false);
        }
        return result;
      },
      resetProgress: async () => {
        const cleared = await clearDeviceProgress();
        if (!cleared) {
          setSaveError(true);
          return false;
        }
        setData(emptyProgress());
        setPersist(true);
        setSaveError(false);
        return true;
      },
    };
  }, [data, day, saveError]);

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress outside provider");
  return ctx;
}
