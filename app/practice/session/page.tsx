"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { withHanzi } from "@/components/Hanzi";
import { Sheet } from "@/components/Sheet";
import { pinyinChoices } from "@/lib/assemble";
import { getLearnable } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { practiceQueue, wordSession } from "@/lib/practice-queue";
import { shuffle } from "@/lib/shuffle";
import { practiceRating, type SavedCard } from "@/lib/srs";

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
  const { cards, answerCard, locale, pinyin, seen, seenItems, xp } = useProgress();
  const t = useT();
  const router = useRouter();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [xpStart] = useState(xp);
  const [deck] = useState(() => (only && seen.has(only) ? wordSession(cards, only) : only ? [] : practiceQueue(cards, seenItems)));
  useEffect(() => {
    if (only && !seen.has(only)) router.replace("/practice");
  }, [only, seen, router]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [shownAt, setShownAt] = useState(0);
  useLayoutEffect(() => {
    setShownAt(Date.now());
  }, [index]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [index]);
  const [remembered, setRemembered] = useState(0);
  const [missed, setMissed] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; answer: string } | null>(null);
  const card = deck[index];

  if (only && !seen.has(only)) return <p className="p-6">{t("loading")}</p>;

  if (deck.length === 0) {
    return (
      <main className="px-6 py-16">
        <h1 className="text-3xl font-bold">{t("practice.none")}</h1>
        <p className="mt-2 text-base text-[#57534E]">{seen.size ? t("practice.noneBody") : t("practice.noWords")}</p>
        <button type="button" className="btn-primary mt-8" onClick={() => router.push("/practice")}>{t("talk.done")}</button>
      </main>
    );
  }

  if (!card) {
    const stillDue = practiceQueue(cards, seenItems).length;
    const nextTime = cards
      .map((saved) => new Date(saved.due).getTime())
      .filter((time) => time > Date.now())
      .sort((a, b) => a - b)[0];
    const when = nextTime ? new Date(nextTime).toLocaleDateString(locale === "es" ? "es" : "en", { month: "short", day: "numeric" }) : "";
    return (
      <main className="px-6 py-16">
        <h1 className="text-3xl font-bold">{t("practice.done")}</h1>
        <p className="mt-2">{t("practice.remembered", { count: remembered })}</p>
        <p className="mt-1 text-[#57534E]">{t("practice.missed", { count: missed })}</p>
        <p className="mt-2 text-[#C48A16]">{t("lesson.xp", { count: Math.max(0, xp - xpStart) })}</p>
        {stillDue === 0 && when ? <p className="mt-4 font-semibold">{t("practice.nextDue", { when })}</p> : null}
        <button className="btn-primary mt-8" onClick={() => router.push("/practice")}>{t("talk.done")}</button>
      </main>
    );
  }

  const item = getLearnable(card.itemId);
  const options = optionsFor(card, locale, seen);
  function grade() {
    if (!selected || !item) return;
    const ok = selected === (card.cardType === "pinyin" ? item.pinyin : card.itemId);
    const seconds = shownAt ? (Date.now() - shownAt) / 1000 : 0;
    const rating = practiceRating(ok, seconds, card.reps);
    answerCard(card, rating, { id: crypto.randomUUID(), sessionId });
    if (ok) setRemembered((n) => n + 1);
    else setMissed((n) => n + 1);
    const answer = card.cardType === "pinyin" ? `${item.pinyin} · ${item.gloss[locale]}` : `${item.hanzi} · ${item.gloss[locale]}`;
    setFeedback({ ok, answer });
  }

  const done = index;
  const total = deck.length;
  return (
    <main className="flex min-h-full flex-col px-5 py-4">
      <div className="mb-5 flex items-center gap-3">
        <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#57534E]" aria-label={t("lesson.leave")} onClick={() => setLeaving(true)}>
          <X size={22} aria-hidden />
        </button>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#E7E0D6]">
          <div className="h-full bg-[#E25B45]" style={{ width: `${total ? Math.min(100, (done / total) * 100) : 0}%` }} />
        </div>
        <p className="text-sm font-semibold tabular-nums text-[#57534E]">{done}/{total}</p>
      </div>
      <p className={card.cardType === "hanzi" ? "mt-2 text-center text-4xl font-semibold leading-tight" : "mt-2 text-center font-[family-name:var(--font-hanzi)] text-[64px] font-medium leading-none"}>{card.cardType === "hanzi" ? item?.gloss[locale] : item?.hanzi}</p>
      {card.cardType === "meaning" && pinyin ? <p className="mt-2 text-center text-lg text-[#57534E]">{item?.pinyin}</p> : null}
      <div className="choice-grid">
        {options.map((option) => {
          const correctValue = card.cardType === "pinyin" ? item?.pinyin ?? "" : card.itemId;
          const mark = !feedback ? null : option.value === correctValue ? "correct" : selected === option.value ? "wrong" : null;
          const border = mark === "correct" ? "border-[#1F8A70]" : mark === "wrong" ? "border-[#9F1239]" : selected === option.value ? "border-[#1C1917]" : "border-[#E7E0D6]";
          return (
            <button type="button" key={option.value} aria-pressed={selected === option.value} disabled={!!feedback} className={`select-ease min-h-12 rounded-xl border-2 bg-white px-4 text-left text-base font-semibold ${border}`} onClick={() => setSelected(option.value)}>
              {withHanzi(option.label)}
            </button>
          );
        })}
      </div>
      {feedback ? <p className={`mt-4 text-lg font-semibold ${feedback.ok ? "text-[#1F8A70]" : "text-[#9F1239]"}`} role="status" aria-live="polite">{feedback.ok ? t("lesson.correct") : t("lesson.wrong")} · {withHanzi(feedback.answer)}</p> : null}
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
      {leaving ? (
        <Sheet title={t("practice.leaveTitle")} closeLabel={t("sheet.close")} onClose={() => setLeaving(false)}>
          <p className="text-base text-[#57534E]">{t("practice.leaveBody")}</p>
          <button type="button" className="btn-primary mt-6" onClick={() => router.push("/practice")}>{t("lesson.leave")}</button>
        </Sheet>
      ) : null}
    </main>
  );
}

function optionsFor(card: SavedCard, locale: "en" | "es", seen: Set<string>): { value: string; label: string }[] {
  const item = getLearnable(card.itemId);
  if (!item) return [];
  const pool = [...seen].filter((id) => id !== card.itemId);
  const picked = shuffle(pool, `${card.itemId}:${card.cardType}`).slice(0, 3);
  if (card.cardType === "pinyin") {
    return pinyinChoices(card.itemId, [...seen], pool, `${card.itemId}:py`).map((py) => ({ value: py, label: py }));
  }
  const ids = shuffle([card.itemId, ...picked], `${card.itemId}:${card.cardType}`);
  return ids.map((id) => {
    const row = getLearnable(id);
    return { value: id, label: card.cardType === "hanzi" ? row?.hanzi ?? id : row?.gloss[locale] ?? id };
  });
}
