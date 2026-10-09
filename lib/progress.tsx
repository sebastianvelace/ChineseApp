"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadDeviceProgress, saveDeviceProgress } from "./device-store";
import { deferExtraNewCards, type SeenStamp } from "./practice-queue";
import { applyLessonRatings, cardKey, freshCard, rateCard, type CardType, type LessonRating, type SavedCard } from "./srs";
import { type Grade } from "ts-fsrs";

export type Locale = "en" | "es";

type XpEvent = { id: string; amount: number; at: string };
type Passed = { ratio: number | null; at: string };
type ReviewRow = { id: string; itemId: string; cardType: CardType; rating: number; at: string; source: "practice" };
type Streak = { current: number; longest: number; lastActive: string | null; freezes: number; granted: number[] };

type Persisted = {
  onboarded: boolean;
  locale: Locale;
  pinyin: boolean;
  dailyGoal: 10 | 20 | 50;
  track: "hsk" | "everyday";
  seen: { id: string; at: string; nodeId: string }[];
  passed: Record<string, Passed>;
  xpEvents: XpEvent[];
  cards: SavedCard[];
  reviews: ReviewRow[];
  streak: Streak;
};

type PassKind = "lesson" | "review" | "talk";

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
  cards: SavedCard[];
  activeDays: string[];
  weekDates: string[];
  completeOnboarding: (locale: Locale, pinyin: boolean) => void;
  setLocale: (locale: Locale) => void;
  setPinyin: (pinyin: boolean) => void;
  setGoal: (goal: 10 | 20 | 50) => void;
  setTrack: (track: "hsk" | "everyday") => void;
  passNode: (nodeId: string, kind: PassKind, info?: { ratio: number; correct: number; itemIds: string[]; ratings?: LessonRating[] }) => void;
  answerCard: (card: SavedCard, rating: Grade, review: { id: string; sessionId: string }) => void;
};

const ProgressContext = createContext<ProgressApi | null>(null);

function today(): string {
  return new Date().toLocaleDateString("en-CA");
}

function localDayFromIso(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const date = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${date}`;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}

function empty(): Persisted {
  return {
    onboarded: false,
    locale: "en",
    pinyin: true,
    dailyGoal: 10,
    track: "hsk",
    seen: [],
    passed: {},
    xpEvents: [],
    cards: [],
    reviews: [],
    streak: { current: 0, longest: 0, lastActive: null, freezes: 0, granted: [] },
  };
}

function bumpStreak(streak: Streak, day: string): Streak {
  if (streak.lastActive === day) return streak;
  let current = 1;
  let freezes = streak.freezes;
  if (streak.lastActive === null) current = 1;
  else if (streak.lastActive === addDays(day, -1)) current = streak.current + 1;
  else if (streak.lastActive === addDays(day, -2) && freezes > 0) {
    freezes -= 1;
    current = streak.current + 1;
  }
  const granted = [...streak.granted];
  for (const mark of [7, 14, 30]) {
    if (current >= mark && !granted.includes(mark) && freezes < 2) {
      freezes += 1;
      granted.push(mark);
    }
  }
  return { current, longest: Math.max(streak.longest, current), lastActive: day, freezes, granted };
}

function ensureCards(cards: SavedCard[], itemIds: string[], day: string): SavedCard[] {
  const next = [...cards];
  const have = new Set(next.map(cardKey));
  for (const itemId of itemIds) {
    for (const cardType of ["meaning", "pinyin", "hanzi"] as CardType[]) {
      const key = `${itemId}:${cardType}`;
      if (have.has(key)) continue;
      next.push(freshCard(itemId, cardType, day, new Date()));
      have.add(key);
    }
  }
  return next;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Persisted | null>(null);
  const [day, setDay] = useState("1970-01-01");

  useEffect(() => {
    setDay(today());
    let cancelled = false;
    loadDeviceProgress<Persisted>()
      .then((saved) => {
        if (!cancelled) setData(saved ? { ...empty(), ...saved } : empty());
      })
      .catch(() => {
        if (!cancelled) setData(empty());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (data) void saveDeviceProgress(data);
  }, [data]);

  const api = useMemo<ProgressApi>(() => {
    const current = data ?? empty();
    const seen = new Set(current.seen.map((s) => s.id));
    const xp = current.xpEvents.reduce((sum, e) => sum + e.amount, 0);
    const xpToday = current.xpEvents.filter((e) => localDayFromIso(e.at) === day).reduce((sum, e) => sum + e.amount, 0);
    const activeDays = [...new Set(current.xpEvents.map((event) => localDayFromIso(event.at)))];
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
      cards: current.cards,
      activeDays,
      weekDates,
      completeOnboarding: (locale, pinyin) => setData((prev) => ({ ...(prev ?? empty()), onboarded: true, locale, pinyin })),
      setLocale: (locale) => setData((prev) => ({ ...(prev ?? empty()), locale })),
      setPinyin: (pinyin) => setData((prev) => ({ ...(prev ?? empty()), pinyin })),
      setGoal: (dailyGoal) => setData((prev) => ({ ...(prev ?? empty()), dailyGoal })),
      setTrack: (track) => setData((prev) => ({ ...(prev ?? empty()), track })),
      passNode: (nodeId, kind, info) => {
        setData((prev) => {
          const base = prev ?? empty();
          const dayNow = today();
          const already = base.passed[nodeId];
          const eventId = already ? `${kind}-replay:${nodeId}:${dayNow}` : `${kind}:${nodeId}`;
          let amount = 0;
          if (!base.xpEvents.some((e) => e.id === eventId)) {
            if (!already) amount = kind === "lesson" ? 20 + 2 * (info?.correct ?? 0) : kind === "review" ? 15 : 10;
            else if (kind === "lesson") amount = 5;
          }
          const xpEvents = amount ? [...base.xpEvents, { id: eventId, amount, at: new Date().toISOString() }] : base.xpEvents;
          const passed = { ...base.passed, [nodeId]: { ratio: info?.ratio ?? 1, at: already?.at ?? new Date().toISOString() } };
          const seenRows = [...base.seen];
          const seenIds = new Set(seenRows.map((s) => s.id));
          for (const id of info?.itemIds ?? []) {
            if (!seenIds.has(id)) {
              seenRows.push({ id, at: new Date().toISOString(), nodeId });
              seenIds.add(id);
            }
          }
          let cards = base.cards;
          if (kind === "lesson" && info) {
            cards = ensureCards(cards, info.itemIds, dayNow);
            if (!already && info.ratings?.length) cards = applyLessonRatings(cards, info.ratings);
            cards = deferExtraNewCards(cards, seenRows, dayNow);
          }
          const streak = amount > 0 || !already ? bumpStreak(base.streak, dayNow) : base.streak;
          return { ...base, xpEvents, passed, seen: seenRows, cards, streak };
        });
      },
      answerCard: (card, rating, review) => {
        setData((prev) => {
          if (!prev) return prev;
          const reviews = prev.reviews ?? [];
          if (reviews.some((row) => row.id === review.id)) return prev;
          const nextCard = rateCard(card, rating);
          const cards = prev.cards.map((c) => (cardKey(c) === cardKey(card) ? nextCard : c));
          const sessionCount = prev.xpEvents.filter((e) => e.id.startsWith(`practice:${review.sessionId}:`)).length;
          const xpEvents = sessionCount >= 20 ? prev.xpEvents : [...prev.xpEvents, { id: `practice:${review.sessionId}:${review.id}`, amount: 1, at: new Date().toISOString() }];
          const streak = bumpStreak(prev.streak, today());
          return {
            ...prev,
            cards,
            xpEvents,
            streak,
            reviews: [...reviews, { id: review.id, itemId: card.itemId, cardType: card.cardType, rating, at: new Date().toISOString(), source: "practice" }],
          };
        });
      },
    };
  }, [data, day]);

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress outside provider");
  return ctx;
}
