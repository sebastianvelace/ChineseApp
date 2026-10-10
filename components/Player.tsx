"use client";

import { Flame, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { withHanzi } from "@/components/Hanzi";
import { Sheet } from "@/components/Sheet";
import { StrokePad } from "@/components/StrokePad";
import { TokenLine } from "@/components/TokenLine";
import { buildMatches, lessonPassed, sentenceWordIds } from "@/lib/lesson-score";
import { gradedItemIds, lessonRatings } from "@/lib/srs";
import { allRadicals, contentTokens, getLearnable, getSentence, keepsCards, radicalFor } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { shuffle } from "@/lib/shuffle";
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
  onNext,
  nextLabel,
  learned,
  xpFor,
  accent,
}: {
  title: string;
  items: ExerciseItem[];
  grammar?: Lesson["grammar"];
  onPass: (result: { ratio: number; correct: number; graded: number; ratings: { itemId: string; rating: 1 | 2 | 3 }[] }) => void;
  onExit: () => void;
  onNext?: () => void;
  nextLabel?: string;
  learned?: string[];
  xpFor: (correct: number) => number;
  accent?: string;
}) {
  const t = useT();
  const { locale, pinyin, streakBurst } = useProgress();
  const planned = useMemo(() => items.filter(isGraded).length, [items]);
  const [queue, setQueue] = useState<Play[]>(() => items.map((item) => ({ item, recycle: false })));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [revealPinyin, setRevealPinyin] = useState(false);
  const [checked, setChecked] = useState<{ ok: boolean; answer: string; gloss: string } | null>(null);
  const correctRef = useRef(0);
  const [phase, setPhase] = useState<"play" | "end">("play");
  const [leaving, setLeaving] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const reported = useRef(false);
  const answeredLock = useRef(false);
  const outcomes = useRef<{ itemId: string; ok: boolean }[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [index, phase]);
  const current = queue[index];
  if (phase === "end" || !current) {
    const passed = ratio >= 0.8;
    return (
      <main className="flex min-h-full flex-col px-5 py-8" style={passed && accent ? { background: `${accent}1f` } : undefined}>
        <h1 className="font-[family-name:var(--font-hanzi)] text-4xl">{passed ? t("lesson.passTitle") : t("lesson.failTitle")}</h1>
        <p className="mt-3 text-lg text-[#57534E]">{Math.round(ratio * 100)}%</p>
        {passed ? <p className="mt-2 text-[#C48A16]">{t("lesson.xp", { count: xpFor(finalCorrect) })}</p> : null}
        {passed && streakBurst ? <p className="mt-2 inline-flex items-center gap-1 font-semibold"><Flame size={18} className="text-[#E25B45]" aria-hidden /> {t("lesson.streak", { count: streakBurst })}</p> : null}
        {passed && learned && learned.length > 0 ? (
          <p className="mt-4 font-[family-name:var(--font-hanzi)] text-2xl leading-9">{learned.join("  ")}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3">
          {passed ? (
            <button className="btn-primary" onClick={onExit}>
              {t("lesson.unit")}
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => {
                reported.current = false;
                answeredLock.current = false;
                outcomes.current = [];
                correctRef.current = 0;
                setQueue(items.map((item) => ({ item, recycle: false })));
                setIndex(0);
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
          {passed && onNext ? (
            <button className="btn-ghost" onClick={onNext}>
              {nextLabel}
            </button>
          ) : null}
          {passed ? null : (
            <button className="btn-ghost" onClick={onExit}>
              {t("lesson.back")}
            </button>
          )}
        </div>
      </main>
    );
  }

  const gradedSoFar = queue.slice(0, index).filter((row) => !row.recycle && isGraded(row.item)).length;
  const bar = planned === 0 ? 1 : gradedSoFar / planned;

  function finish(ok: boolean, answer: string, glossText = "", itemIds?: string[]) {
    if (answeredLock.current) return;
    answeredLock.current = true;
    if (!current.recycle && ok) correctRef.current += 1;
    if (!current.recycle) {
      for (const itemId of itemIds ?? gradedItemIds(current.item)) outcomes.current.push({ itemId, ok });
    }
    setChecked({ ok, answer, gloss: glossText });
  }

  function onCheck() {
    const item = current.item;
    if (item.type === "meaning") {
      const ok = selected === item.itemId;
      finish(ok, gloss(item.itemId, locale), getLearnable(item.itemId)?.hanzi ?? "");
      return;
    }
    if (item.type === "pinyin") {
      const answer = getLearnable(item.itemId)?.pinyin ?? "";
      finish(selected === answer, answer, gloss(item.itemId, locale));
      return;
    }
    if (item.type === "blank") {
      const sentence = getSentence(item.sentenceId);
      const token = sentence ? contentTokens(sentence)[item.blankAt] : undefined;
      const answer = token?.text ?? "";
      const tokenId = token?.wordId ?? token?.supportId;
      finish(selected === answer, answer, tokenId ? gloss(tokenId, locale) : "", tokenId && keepsCards(tokenId) ? [tokenId] : []);
      return;
    }
    if (item.type === "build") {
      const sentence = getSentence(item.sentenceId);
      const tokens = sentence ? contentTokens(sentence) : [];
      const ok = buildMatches(placed, tokens);
      finish(ok, sentence?.hanzi ?? "", sentence?.translation[locale] ?? "", sentenceWordIds(tokens).filter(keepsCards));
      return;
    }
    if (item.type === "tone") {
      finish(selected === String(item.tone), t(`tone.${item.tone}`), gloss(item.itemId, locale));
      return;
    }
    if (item.type === "radical") {
      const radical = allRadicals().find((row) => row.id === item.radicalId);
      const answer = radical ? `${radical.variant} · ${radical.gloss[locale]}` : item.char;
      finish(selected === item.radicalId, answer, radical?.hint[locale] ?? "");
    }
  }

  function onContinue() {
    const item = current.item;
    const ok = checked?.ok ?? false;
    let nextQueue = queue;
    if (!ok && !current.recycle && isGraded(item)) nextQueue = [...queue, { item, recycle: true }];
    const nextIndex = index + 1;
    const firstTries = nextQueue.filter((row) => !row.recycle && isGraded(row.item));
    const answeredCorrect = correctRef.current;
    if (nextIndex >= nextQueue.length) {
      const graded = firstTries.length || planned;
      const nextRatio = graded === 0 ? 1 : answeredCorrect / graded;
      setFinalCorrect(answeredCorrect);
      setRatio(nextRatio);
      setQueue(nextQueue);
      setPhase("end");
      if (lessonPassed(answeredCorrect, graded) && !reported.current) {
        reported.current = true;
        onPass({ ratio: nextRatio, correct: answeredCorrect, graded, ratings: lessonRatings(outcomes.current) });
      }
      return;
    }
    setQueue(nextQueue);
    setIndex(nextIndex);
    answeredLock.current = false;
    setSelected(null);
    setPlaced([]);
    setChecked(null);
    setRevealPinyin(false);
  }

  const canCheck =
    current.item.type === "build"
      ? placed.length === (getSentence(current.item.sentenceId) ? contentTokens(getSentence(current.item.sentenceId)!).length : 0)
      : current.item.type === "line" ||
          current.item.type === "teach" ||
          current.item.type === "teach-set" ||
          current.item.type === "stroke" ||
          current.item.type === "match"
        ? false
        : selected !== null;

  return (
    <main className="flex min-h-full flex-col px-5 py-4">
      <div className="mb-2 flex items-center gap-3">
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#57534E]"
          aria-label={t("lesson.leave")}
          onClick={() => setLeaving(true)}
        >
          <X size={22} aria-hidden />
        </button>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#E7E0D6]">
          <div className="h-full bg-[#E25B45]" style={{ width: `${Math.min(100, bar * 100)}%` }} />
        </div>
        <p className="text-sm font-semibold tabular-nums text-[#57534E]">{gradedSoFar}/{planned}</p>
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
          onResolved={(ok, answer) => finish(ok, answer)}
        />
      </div>
      <div className="mt-auto bg-[#F7F3EC] py-4">
        {checked ? (
          <div className="mb-3 rounded-2xl bg-white px-4 py-3" role="status" aria-live="polite">
            <p className={checked.ok ? "font-semibold text-[#1F8A70]" : "font-semibold text-[#9F1239]"}>
              {checked.ok ? t("lesson.correct") : t("lesson.wrong")}
            </p>
            {checked.ok ? null : (
              <>
                <p className={`mt-1 text-lg ${/[\u3400-\u9fff]/.test(checked.answer) ? "font-[family-name:var(--font-hanzi)]" : ""}`}>{checked.answer}</p>
                {checked.gloss && checked.gloss !== checked.answer ? (
                  <p className={`mt-1 text-[#57534E] ${/[\u3400-\u9fff]/.test(checked.gloss) ? "font-[family-name:var(--font-hanzi)] text-lg" : ""}`}>{checked.gloss}</p>
                ) : null}
              </>
            )}
          </div>
        ) : null}
        {current.item.type === "teach" || current.item.type === "teach-set" || current.item.type === "line" || ((current.item.type === "stroke" || current.item.type === "match") && checked) ? (
          <button className="btn-primary" onClick={onContinue}>
            {t("lesson.continue")}
          </button>
        ) : current.item.type === "stroke" || current.item.type === "match" ? null : checked ? (
          <button className="btn-primary" onClick={onContinue}>
            {t("lesson.continue")}
          </button>
        ) : (
          <button type="button" className="btn-primary" disabled={!canCheck} onClick={onCheck}>
            {t("lesson.check")}
          </button>
        )}
      </div>
      {leaving ? (
        <Sheet title={t("lesson.leaveTitle")} closeLabel={t("sheet.close")} onClose={() => setLeaving(false)}>
          <p className="text-base text-[#57534E]">{t("lesson.leaveBody")}</p>
          <button type="button" className="btn-primary mt-6" onClick={onExit}>
            {t("lesson.leave")}
          </button>
        </Sheet>
      ) : null}
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
  onResolved,
}: {
  item: ExerciseItem;
  grammar?: Lesson["grammar"];
  locale: Locale;
  showPinyin: boolean;
  selected: string | null;
  placed: string[];
  checked: { ok: boolean; answer: string; gloss: string } | null;
  onSelect: (id: string) => void;
  onPlace: (keys: string[]) => void;
  onReveal: () => void;
  onResolved: (ok: boolean, answer: string) => void;
}) {
  const t = useT();
  if (item.type === "teach-set") {
    return (
      <div>
        {item.showGrammar && grammar ? (
          <div className="mb-4 rounded-2xl bg-white p-4">
            <p className="font-[family-name:var(--font-hanzi)] text-xl">{grammar.pattern}</p>
            <p className="mt-2 text-base leading-6 text-[#57534E]">{grammar.body[locale]}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-3 gap-3">
          {item.itemIds.map((id) => {
            const row = getLearnable(id);
            if (!row) return null;
            return (
              <article key={id} className="rounded-2xl bg-white px-2 py-4 text-center">
                <p className="font-[family-name:var(--font-hanzi)] text-[64px] font-medium leading-none">{row.hanzi}</p>
                {showPinyin ? <p className="mt-2 text-lg text-[#57534E]">{row.pinyin}</p> : null}
                <p className="mt-1 text-base text-[#57534E]">{row.gloss[locale]}</p>
              </article>
            );
          })}
        </div>
        {!showPinyin ? (
          <button type="button" className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-[#E25B45]" onClick={onReveal}>{t("lesson.showPinyin")}</button>
        ) : null}
      </div>
    );
  }

  if (item.type === "teach") {
    const ids = [item.itemId];
    return (
      <div>
        {item.showGrammar && grammar ? (
          <p className="mb-4 inline-block rounded-full bg-white px-4 py-2 font-[family-name:var(--font-hanzi)] text-base">{grammar.pattern}</p>
        ) : null}
        <div className="flex flex-col gap-3">
          {ids.map((id) => {
            const row = getLearnable(id);
            const exampleId = item.exampleId;
            const example = exampleId ? getSentence(exampleId) : undefined;
            if (!row) return null;
            return (
              <article key={id} className="rounded-2xl bg-white p-5 text-center shadow-[0_8px_24px_rgb(28_25_23/6%)]">
                <p className="font-[family-name:var(--font-hanzi)] text-[64px] font-medium leading-none">{row.hanzi}</p>
                {showPinyin ? <p className="mt-2 text-lg text-[#57534E]">{row.pinyin}</p> : (
                  <button type="button" className="mt-2 inline-flex min-h-11 items-center text-base font-semibold text-[#E25B45]" onClick={onReveal}>{t("lesson.showPinyin")}</button>
                )}
                <p className="mt-3 text-lg">{row.gloss[locale]}</p>
                <RadicalHint hanzi={row.hanzi} locale={locale} />
                {example ? (
                  <div className="mt-4 text-left">
                    <TokenLine tokens={example.tokens} />
                    <p className="mt-1 text-base text-[#57534E]">{example.translation[locale]}</p>
                  </div>
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
        {sentence.speaker ? <p className="text-base font-semibold text-[#57534E]">{sentence.speaker}</p> : null}
        <div className="mt-3">
          <TokenLine tokens={sentence.tokens} size="card" />
        </div>
        {showPinyin ? <p className="mt-2 text-lg text-[#57534E]">{sentence.pinyin}</p> : null}
        <p className="mt-3">{sentence.translation[locale]}</p>
      </article>
    );
  }

  if (item.type === "meaning" || item.type === "pinyin") {
    const row = getLearnable(item.itemId);
    return (
      <div>
        <p className="text-center font-[family-name:var(--font-hanzi)] text-[64px] font-medium">{row?.hanzi}</p>
        {item.type === "meaning" && showPinyin ? <p className="mt-2 text-center text-lg text-[#57534E]">{row?.pinyin}</p> : null}
        <div className="choice-grid">
          {item.options.map((option) => {
            const label = item.type === "meaning" ? gloss(option, locale) : option;
            const correctValue = item.type === "meaning" ? item.itemId : getLearnable(item.itemId)?.pinyin ?? "";
            return (
              <Choice key={option} label={label} selected={selected === option} verdict={verdict(checked, selected, option, correctValue)} disabled={!!checked} onClick={() => onSelect(option)} />
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
        <div className="choice-grid">
          {item.options.map((option) => (
            <Choice key={option} label={option} selected={selected === option} verdict={verdict(checked, selected, option, tokens[item.blankAt]?.text ?? "")} disabled={!!checked} onClick={() => onSelect(option)} />
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "tone") {
    const row = getLearnable(item.itemId);
    return (
      <div>
        <p className="text-center text-sm text-[#57534E]">{t("tone.prompt")}</p>
        <p className="mt-2 text-center font-[family-name:var(--font-hanzi)] text-[64px] font-medium">{row?.hanzi}</p>
        <p className="mt-2 text-center text-lg text-[#57534E]">{row?.pinyin}</p>
        <div className="choice-grid">
          {[1, 2, 3, 4, 5].map((tone) => (
            <Choice key={tone} label={t(`tone.${tone}`)} selected={selected === String(tone)} verdict={verdict(checked, selected, String(tone), String(item.tone))} disabled={!!checked} onClick={() => onSelect(String(tone))} />
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "radical") {
    return (
      <div>
        <p className="text-center text-sm text-[#57534E]">{t("radical.prompt")}</p>
        <p className="mt-2 text-center font-[family-name:var(--font-hanzi)] text-[64px] font-medium">{item.char}</p>
        <div className="choice-grid">
          {item.options.map((id) => {
            const radical = allRadicals().find((row) => row.id === id);
            const label = radical ? `${radical.variant} · ${radical.gloss[locale]}` : id;
            return <Choice key={id} label={label} selected={selected === id} verdict={verdict(checked, selected, id, item.radicalId)} disabled={!!checked} onClick={() => onSelect(id)} />;
          })}
        </div>
      </div>
    );
  }

  if (item.type === "stroke") {
    return <StrokePad char={item.char} disabled={!!checked} onResult={(ok) => onResolved(ok, item.char)} />;
  }

  if (item.type === "match") {
    return <MatchBoard itemIds={item.itemIds} locale={locale} disabled={!!checked} onDone={(ok) => onResolved(ok, "")} />;
  }

  if (item.type !== "build") return null;

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
          <button type="button" key={key} className="tile" disabled={!!checked} onClick={() => onPlace(placed.filter((k) => k !== key))}>
            {byKey.get(key)?.text}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bank.map((tile) => (
          <button type="button" key={tile.key} className="tile" disabled={!!checked} onClick={() => onPlace([...placed, tile.key])}>
            {tile.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function RadicalHint({ hanzi, locale }: { hanzi: string; locale: Locale }) {
  const radical = [...hanzi].map((char) => radicalFor(char)).find(Boolean);
  if (!radical) return null;
  return (
    <p className="mt-3 text-left text-sm leading-5 text-[#57534E]">
      <span className="font-[family-name:var(--font-hanzi)] text-base text-[#1C1917]">{radical.variant}</span> · {radical.gloss[locale]}. {radical.hint[locale]}
    </p>
  );
}

function MatchBoard({ itemIds, locale, disabled, onDone }: { itemIds: string[]; locale: Locale; disabled: boolean; onDone: (ok: boolean) => void }) {
  const t = useT();
  const hanzi = shuffle(itemIds, itemIds.join(":h"));
  const glosses = shuffle(itemIds, itemIds.join(":g"));
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState<{ hanzi: string; gloss: string } | null>(null);
  const done = useRef(false);

  function chooseGloss(id: string) {
    if (disabled || !picked || matched.includes(id)) return;
    if (picked === id) {
      const next = [...matched, id];
      setMatched(next);
      setPicked(null);
      if (next.length === itemIds.length && !done.current) {
        done.current = true;
        onDone(!missed);
      }
      return;
    }
    setMissed(true);
    setShake({ hanzi: picked, gloss: id });
    setPicked(null);
    window.setTimeout(() => setShake(null), 350);
  }

  return (
    <div>
      <p className="mb-3 text-sm text-[#57534E]">{t("match.prompt")}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          {hanzi.map((id) => (
            <button type="button" key={id} disabled={disabled || matched.includes(id)} className={`min-h-12 rounded-xl border bg-white font-[family-name:var(--font-hanzi)] text-[22px] font-medium ${picked === id ? "border-[#1C1917]" : "border-[#E7E0D6]"} ${matched.includes(id) ? "opacity-40" : ""} ${shake?.hanzi === id ? "shake" : ""}`} onClick={() => setPicked(id)}>
              {getLearnable(id)?.hanzi}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {glosses.map((id) => (
            <button type="button" key={id} disabled={disabled || matched.includes(id)} className={`min-h-12 rounded-xl border border-[#E7E0D6] bg-white px-2 text-base font-semibold ${matched.includes(id) ? "opacity-40" : ""} ${shake?.gloss === id ? "shake" : ""}`} onClick={() => chooseGloss(id)}>
              {gloss(id, locale)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function verdict(checked: { ok: boolean } | null, selected: string | null, value: string, correct: string): "correct" | "wrong" | null {
  if (!checked) return null;
  if (value === correct) return "correct";
  if (selected === value) return "wrong";
  return null;
}

function Choice({
  label,
  selected,
  verdict: mark,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  verdict: "correct" | "wrong" | null;
  disabled: boolean;
  onClick: () => void;
}) {
  const border = mark === "correct" ? "border-[#1F8A70]" : mark === "wrong" ? "border-[#9F1239]" : selected ? "border-[#1C1917]" : "border-[#E7E0D6]";
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`select-ease min-h-12 rounded-xl border-2 bg-white px-4 py-3 text-left text-base font-semibold ${border}`}
      disabled={disabled}
      onClick={onClick}
    >
      {withHanzi(label)}
    </button>
  );
}
