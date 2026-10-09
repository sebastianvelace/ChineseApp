"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { allLearnableIds, getLearnable } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { dueCards, useProgress } from "@/lib/progress";
import { shuffle } from "@/lib/shuffle";
import type { SavedCard } from "@/lib/srs";
import { Rating } from "ts-fsrs";

export default function SessionPage() {
  return (
    <Suspense fallback={<p className="p-6">…</p>}>
      <Session />
    </Suspense>
  );
}

function Session() {
  const { ready } = useProgress();
  const t = useT();
  if (!ready) return <p className="p-6">{t("loading")}</p>;
  return <Deck />;
}

function Deck() {
  const params = useSearchParams();
  const only = params.get("item");
  const { cards, answerCard, locale, pinyin } = useProgress();
  const t = useT();
  const router = useRouter();
  const [deck] = useState(() => (only ? cards.filter((c) => c.itemId === only) : dueCards(cards).slice(0, 20)));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [shownAt, setShownAt] = useState(0);
  useEffect(() => {
    setShownAt(Date.now());
  }, [index]);
  const [remembered, setRemembered] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const card = deck[index];

  if (!card) {
    return (
      <main className="px-6 py-16">
        <h1 className="text-3xl font-bold">{t("practice.done")}</h1>
        <p className="mt-2">{t("practice.remembered", { count: remembered })}</p>
        <button className="btn-primary mt-8" onClick={() => router.push("/practice")}>{t("lesson.back")}</button>
      </main>
    );
  }

  const item = getLearnable(card.itemId);
  const options = optionsFor(card, locale);
  function grade() {
    if (!selected || !item) return;
    const ok = selected === (card.cardType === "pinyin" ? item.pinyin : card.itemId);
    const seconds = (Date.now() - shownAt) / 1000;
    let rating = Rating.Again;
    if (ok && seconds < 4 && card.reps >= 2) rating = Rating.Easy;
    else if (ok && seconds < 8) rating = Rating.Good;
    else if (ok) rating = Rating.Hard;
    answerCard(card, rating);
    if (ok) setRemembered((n) => n + 1);
    setFeedback(ok ? item.hanzi : `${item.hanzi} · ${item.gloss[locale]}`);
  }

  return (
    <main className="flex min-h-full flex-col px-5 py-6">
      <button className="self-start text-sm font-semibold text-[#57534E]" onClick={() => router.push("/practice")}>{t("lesson.leave")}</button>
      <p className="mt-6 text-center font-[family-name:var(--font-hanzi)] text-6xl">{card.cardType === "hanzi" ? item?.gloss[locale] : item?.hanzi}</p>
      {card.cardType === "meaning" && pinyin ? <p className="mt-2 text-center text-[#57534E]">{item?.pinyin}</p> : null}
      <div className="mt-6 flex flex-col gap-3">
        {options.map((option) => (
          <button key={option.value} className={`min-h-12 rounded-xl border bg-white px-4 text-left font-semibold ${selected === option.value ? "border-[#1C1917]" : "border-[#E7E0D6]"}`} onClick={() => setSelected(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      {feedback ? <p className="mt-4 font-[family-name:var(--font-hanzi)] text-lg">{feedback}</p> : null}
      <button
        className="btn-primary mt-auto"
        disabled={!selected && !feedback}
        onClick={() => {
          if (!feedback) {
            grade();
            return;
          }
          setFeedback(null);
          setSelected(null);
          setShownAt(Date.now());
          setIndex((n) => n + 1);
        }}
      >
        {feedback ? t("lesson.continue") : t("lesson.check")}
      </button>
    </main>
  );
}

function optionsFor(card: SavedCard, locale: "en" | "es"): { value: string; label: string }[] {
  const item = getLearnable(card.itemId);
  if (!item) return [];
  const pool = allLearnableIds().filter((id) => id !== card.itemId);
  const picked = shuffle(pool, `${card.itemId}:${card.cardType}`).slice(0, 3);
  if (card.cardType === "pinyin") {
    const options = [item.pinyin, ...picked.map((id) => getLearnable(id)?.pinyin ?? "")].filter(Boolean);
    return shuffle([...new Set(options)], `${card.itemId}:py`).map((py) => ({ value: py, label: py }));
  }
  const ids = shuffle([card.itemId, ...picked], `${card.itemId}:${card.cardType}`);
  return ids.map((id) => {
    const row = getLearnable(id);
    return { value: id, label: card.cardType === "hanzi" ? row?.hanzi ?? id : row?.gloss[locale] ?? id };
  });
}
