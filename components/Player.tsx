"use client";

import { useMemo, useRef, useState } from "react";
import { contentTokens, exampleSentence, getLearnable, getSentence } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import type { ExerciseItem, Lesson, Locale } from "@/lib/types";
import { isGraded } from "@/lib/types";

type Play = { item: ExerciseItem; recycle: boolean };

function gloss(id: string, locale: Locale): string {
  return getLearnable(id)?.gloss[locale] ?? id;
}

export function Player({
  title,
  items,
  grammar,
  onPass,
  onExit,
  xpFor,
}: {
  title: string;
  items: ExerciseItem[];
  grammar?: Lesson["grammar"];
  onPass: (result: { ratio: number; correct: number; graded: number }) => void;
  onExit: () => void;
  xpFor: (correct: number) => number;
}) {
  const t = useT();
  const { locale, pinyin } = useProgress();
  const planned = useMemo(() => items.filter(isGraded).length, [items]);
  const [queue, setQueue] = useState<Play[]>(() => items.map((item) => ({ item, recycle: false })));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [revealPinyin, setRevealPinyin] = useState(false);
  const [checked, setChecked] = useState<{ ok: boolean; answer: string } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<"play" | "end">("play");
  const [ratio, setRatio] = useState(0);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const reported = useRef(false);

  const current = queue[index];
  if (phase === "end" || !current) {
    const passed = ratio >= 0.8;
    return (
      <main className="flex min-h-full flex-col px-5 py-8">
        <h1 className="font-[family-name:var(--font-hanzi)] text-4xl">{passed ? t("lesson.passTitle") : t("lesson.failTitle")}</h1>
        <p className="mt-3 text-lg text-[#57534E]">{Math.round(ratio * 100)}%</p>
        {passed ? <p className="mt-2 text-[#C48A16]">{t("lesson.xp", { count: xpFor(finalCorrect) })}</p> : null}
        <div className="mt-8 flex flex-col gap-3">
          {passed ? null : (
            <button
              className="btn-primary"
              onClick={() => {
                reported.current = false;
                setQueue(items.map((item) => ({ item, recycle: false })));
                setIndex(0);
                setCorrectCount(0);
                setSelected(null);
                setPlaced([]);
                setChecked(null);
                setRatio(0);
                setPhase("play");
              }}
            >
              {t("lesson.retry")}
            </button>
          )}
          <button className={passed ? "btn-primary" : "btn-ghost"} onClick={onExit}>
            {t("lesson.back")}
          </button>
        </div>
      </main>
    );
  }

  const gradedSoFar = queue.slice(0, index).filter((row) => !row.recycle && isGraded(row.item)).length;
  const bar = planned === 0 ? 1 : gradedSoFar / planned;

  function finish(ok: boolean, answer: string) {
    if (current.recycle) {
      setChecked({ ok, answer });
      return;
    }
    if (ok) setCorrectCount((n) => n + 1);
    setChecked({ ok, answer });
  }

  function onCheck() {
    const item = current.item;
    if (item.type === "meaning") {
      const ok = selected === item.itemId;
      finish(ok, gloss(item.itemId, locale));
      return;
    }
    if (item.type === "pinyin") {
      const answer = getLearnable(item.itemId)?.pinyin ?? "";
      finish(selected === answer, answer);
      return;
    }
    if (item.type === "blank") {
      const sentence = getSentence(item.sentenceId);
      const answer = sentence ? contentTokens(sentence)[item.blankAt]?.text ?? "" : "";
      finish(selected === answer, sentence?.hanzi ?? answer);
      return;
    }
    if (item.type === "build") {
      const sentence = getSentence(item.sentenceId);
      const tokens = sentence ? contentTokens(sentence) : [];
      const ok = placed.join("|") === tokens.map((_, i) => String(i)).join("|");
      finish(ok, sentence?.hanzi ?? "");
    }
  }

  function onContinue() {
    const item = current.item;
    const ok = checked?.ok ?? false;
    let nextQueue = queue;
    if (!ok && !current.recycle && isGraded(item)) nextQueue = [...queue, { item, recycle: true }];
    const nextIndex = index + 1;
    const firstTries = nextQueue.filter((row) => !row.recycle && isGraded(row.item));
    const answeredCorrect = correctCount;
    if (nextIndex >= nextQueue.length) {
      const graded = firstTries.length || planned;
      const nextRatio = graded === 0 ? 1 : answeredCorrect / graded;
      setFinalCorrect(answeredCorrect);
      setRatio(nextRatio);
      setQueue(nextQueue);
      setPhase("end");
      if (nextRatio >= 0.8 && !reported.current) {
        reported.current = true;
        onPass({ ratio: nextRatio, correct: answeredCorrect, graded });
      }
      return;
    }
    setQueue(nextQueue);
    setIndex(nextIndex);
    setSelected(null);
    setPlaced([]);
    setChecked(null);
    setRevealPinyin(false);
  }

  const canCheck =
    current.item.type === "build"
      ? placed.length === (getSentence(current.item.sentenceId) ? contentTokens(getSentence(current.item.sentenceId)!).length : 0)
      : current.item.type === "line" || current.item.type === "teach" || current.item.type === "teach-set"
        ? false
        : selected !== null;

  return (
    <main className="flex min-h-full flex-col px-5 py-4">
      <div className="mb-5 h-1 overflow-hidden rounded-full bg-[#E7E0D6]">
        <div className="h-full bg-[#E25B45]" style={{ width: `${Math.min(100, bar * 100)}%` }} />
      </div>
      <p className="mb-4 text-sm text-[#57534E]">{title}</p>
      <div className="flex-1">
        <Card
          item={current.item}
          grammar={grammar}
          locale={locale}
          showPinyin={pinyin || revealPinyin}
          selected={selected}
          placed={placed}
          checked={checked}
          onSelect={setSelected}
          onPlace={setPlaced}
          onReveal={() => setRevealPinyin(true)}
        />
      </div>
      <div className="sticky bottom-0 bg-[#F7F3EC] py-4">
        {checked ? (
          <div className="mb-3 rounded-2xl bg-white px-4 py-3">
            <p className={checked.ok ? "font-semibold text-[#1F8A70]" : "font-semibold text-[#9F1239]"}>
              {checked.ok ? t("lesson.correct") : t("lesson.wrong")}
            </p>
            {checked.ok ? null : <p className="mt-1 font-[family-name:var(--font-hanzi)] text-lg">{checked.answer}</p>}
          </div>
        ) : null}
        {current.item.type === "teach" || current.item.type === "teach-set" || current.item.type === "line" ? (
          <button className="btn-primary" onClick={onContinue}>
            {t("lesson.continue")}
          </button>
        ) : checked ? (
          <button className="btn-primary" onClick={onContinue}>
            {t("lesson.continue")}
          </button>
        ) : (
          <button className="btn-primary" disabled={!canCheck} onClick={onCheck}>
            {t("lesson.check")}
          </button>
        )}
      </div>
    </main>
  );
}

function Card({
  item,
  grammar,
  locale,
  showPinyin,
  selected,
  placed,
  checked,
  onSelect,
  onPlace,
  onReveal,
}: {
  item: ExerciseItem;
  grammar?: Lesson["grammar"];
  locale: Locale;
  showPinyin: boolean;
  selected: string | null;
  placed: string[];
  checked: { ok: boolean; answer: string } | null;
  onSelect: (id: string) => void;
  onPlace: (keys: string[]) => void;
  onReveal: () => void;
}) {
  const t = useT();
  if (item.type === "teach" || item.type === "teach-set") {
    const ids = item.type === "teach" ? [item.itemId] : item.itemIds;
    return (
      <div>
        {item.showGrammar && grammar ? (
          <div className="mb-4 rounded-2xl bg-white p-4">
            <p className="font-[family-name:var(--font-hanzi)] text-xl">{grammar.pattern}</p>
            <p className="mt-2 text-[15px] leading-6 text-[#57534E]">{grammar.body[locale]}</p>
          </div>
        ) : null}
        <div className="flex flex-col gap-3">
          {ids.map((id) => {
            const row = getLearnable(id);
            const example = row ? exampleSentence(row) : undefined;
            if (!row) return null;
            return (
              <article key={id} className="rounded-2xl bg-white p-5 text-center shadow-[0_8px_24px_rgb(28_25_23/6%)]">
                <p className="font-[family-name:var(--font-hanzi)] text-6xl font-medium">{row.hanzi}</p>
                {showPinyin ? <p className="mt-2 text-lg text-[#57534E]">{row.pinyin}</p> : (
                  <button className="mt-2 text-sm font-semibold text-[#E25B45]" onClick={onReveal}>{t("lesson.showPinyin")}</button>
                )}
                <p className="mt-3 text-lg">{row.gloss[locale]}</p>
                {example ? (
                  <p className="mt-4 text-left text-[15px] leading-6">
                    <span className="font-[family-name:var(--font-hanzi)]">{example.hanzi}</span>
                    <span className="mt-1 block text-[#57534E]">{example.translation[locale]}</span>
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  if (item.type === "line") {
    const sentence = getSentence(item.sentenceId);
    if (!sentence) return null;
    return (
      <article className="rounded-2xl bg-white p-5">
        <p className="font-[family-name:var(--font-hanzi)] text-2xl leading-9">{sentence.hanzi}</p>
        {showPinyin ? <p className="mt-2 text-[#57534E]">{sentence.pinyin}</p> : null}
        <p className="mt-3">{sentence.translation[locale]}</p>
      </article>
    );
  }

  if (item.type === "meaning" || item.type === "pinyin") {
    const row = getLearnable(item.itemId);
    return (
      <div>
        <p className="text-center font-[family-name:var(--font-hanzi)] text-6xl font-medium">{row?.hanzi}</p>
        {item.type === "meaning" && showPinyin ? <p className="mt-2 text-center text-lg text-[#57534E]">{row?.pinyin}</p> : null}
        <div className="mt-6 flex flex-col gap-3">
          {item.options.map((option) => {
            const label = item.type === "meaning" ? gloss(option, locale) : option;
            const value = item.type === "meaning" ? option : option;
            return (
              <Choice key={option} label={label} selected={selected === value} disabled={!!checked} onClick={() => onSelect(value)} />
            );
          })}
        </div>
      </div>
    );
  }

  if (item.type === "blank") {
    const sentence = getSentence(item.sentenceId);
    const tokens = sentence ? contentTokens(sentence) : [];
    return (
      <div>
        <p className="text-lg">{sentence?.translation[locale]}</p>
        <p className="mt-4 font-[family-name:var(--font-hanzi)] text-2xl leading-9">
          {tokens.map((token, i) => (i === item.blankAt ? " ____ " : token.text)).join("")}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {item.options.map((option) => (
            <Choice key={option} label={option} selected={selected === option} disabled={!!checked} onClick={() => onSelect(option)} />
          ))}
        </div>
      </div>
    );
  }

  const sentence = getSentence(item.sentenceId);
  const tokens = sentence ? contentTokens(sentence) : [];
  const tiles = tokens.map((token, i) => ({ key: String(i), text: token.text }));
  const byKey = new Map(tiles.map((tile) => [tile.key, tile]));
  const bank = item.order.map((i) => tiles[i]).filter((tile): tile is { key: string; text: string } => !!tile && !placed.includes(tile.key));
  return (
    <div>
      <p className="text-lg">{sentence?.translation[locale]}</p>
      <div className="mt-4 flex min-h-16 flex-wrap gap-2 rounded-2xl bg-white p-3">
        {placed.map((key) => (
          <button key={key} className="tile" disabled={!!checked} onClick={() => onPlace(placed.filter((k) => k !== key))}>
            {byKey.get(key)?.text}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bank.map((tile) => (
          <button key={tile.key} className="tile" disabled={!!checked} onClick={() => onPlace([...placed, tile.key])}>
            {tile.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Choice({ label, selected, disabled, onClick }: { label: string; selected: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      className={`min-h-12 rounded-xl border px-4 py-3 text-left text-base font-semibold ${selected ? "border-[#1C1917] bg-white" : "border-[#E7E0D6] bg-white"}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
