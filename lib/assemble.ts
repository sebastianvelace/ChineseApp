import { allRadicals, allUnits, contentTokens, findLesson, firstTone, getDialogue, getLearnable, getSentence, radicalFor } from "./content";
import { firstNumberedTone, markPinyin, withFirstTone } from "./pinyin";
import { shuffle } from "./shuffle";
import type { ExerciseItem, Lesson, Review, Unit } from "./types";

function introducedIds(lessonId: string): string[] {
  const units = allUnits();
  const unit = units.find((item) => item.lessons.some((lesson) => lesson.id === lessonId));
  if (!unit) return [];
  const ids: string[] = [];
  for (const item of units) {
    if (item.trackId !== unit.trackId) continue;
    for (const lesson of item.lessons) {
      ids.push(...lesson.targetWordIds, ...lesson.supportTargetIds);
      if (lesson.id === lessonId) return [...new Set(ids)];
    }
  }
  return [...new Set(ids)];
}

function padIds(correct: string, pool: string[], seed: string): string[] {
  const options = [correct];
  for (const id of pool) {
    if (!options.includes(id)) options.push(id);
    if (options.length === 4) break;
  }
  return shuffle(options, seed);
}

function meaningItem(itemId: string, pool: string[], seed: string): ExerciseItem {
  return { type: "meaning", itemId, options: padIds(itemId, pool, seed) };
}

function pinyinChoices(itemId: string, lessonTargets: string[], pool: string[], seed: string): string[] {
  const item = getLearnable(itemId);
  const correct = item?.pinyin ?? itemId;
  const options = [correct];
  const numbered = item?.pinyinNumbered ?? "";
  const trueTone = firstNumberedTone(numbered);
  if (numbered && trueTone) {
    for (const tone of [1, 2, 3, 4, 5]) {
      if (tone === trueTone) continue;
      const marked = markPinyin(withFirstTone(numbered, tone));
      if (marked && !options.includes(marked)) options.push(marked);
      if (options.length === 4) break;
    }
  }
  const rest = [...lessonTargets.filter((id) => id !== itemId), ...pool.filter((id) => id !== itemId && !lessonTargets.includes(id))];
  for (const id of rest) {
    if (options.length >= 4) break;
    const py = getLearnable(id)?.pinyin ?? "";
    if (py && !options.includes(py)) options.push(py);
  }
  return shuffle(options.slice(0, 4), seed);
}

function pinyinItem(itemId: string, lessonTargets: string[], pool: string[], seed: string): ExerciseItem {
  return { type: "pinyin", itemId, options: pinyinChoices(itemId, lessonTargets, pool, seed) };
}

function setBuildSentence(sentenceIds: string[]) {
  for (const id of sentenceIds) {
    const sentence = getSentence(id);
    if (sentence && (sentence.hanzi.includes("十一") || sentence.hanzi.includes("三十五"))) return sentence;
  }
  return getSentence(sentenceIds[0] ?? "");
}

function sentenceWithTarget(ids: string[], sentenceIds: string[], preferLater = false) {
  const list = preferLater ? [...sentenceIds].reverse() : sentenceIds;
  for (const id of list) {
    const sentence = getSentence(id);
    if (!sentence) continue;
    const hit = contentTokens(sentence).some((t) => {
      const tokenId = t.wordId ?? t.supportId;
      return tokenId ? ids.includes(tokenId) : false;
    });
    if (hit) return sentence;
  }
  return getSentence(sentenceIds[0] ?? "");
}

function buildItem(sentenceId: string, seed: string): ExerciseItem | null {
  const sentence = getSentence(sentenceId);
  if (!sentence) return null;
  const indexes = contentTokens(sentence).map((_, i) => i);
  if (indexes.length === 0) return null;
  return { type: "build", sentenceId, order: shuffle(indexes, seed) };
}

function blankItem(sentenceId: string, targetIds: string[], seed: string): ExerciseItem | null {
  const sentence = getSentence(sentenceId);
  if (!sentence) return null;
  const tokens = contentTokens(sentence);
  let blankAt = tokens.findIndex((t) => {
    const id = t.wordId ?? t.supportId;
    return id ? targetIds.includes(id) : false;
  });
  if (blankAt < 0) blankAt = 0;
  const correct = tokens[blankAt]?.text;
  if (!correct) return null;
  const options = [correct];
  for (const id of targetIds) {
    const hanzi = getLearnable(id)?.hanzi;
    if (hanzi && !options.includes(hanzi)) options.push(hanzi);
    if (options.length === 4) break;
  }
  for (const token of tokens) {
    if (!options.includes(token.text)) options.push(token.text);
    if (options.length === 4) break;
  }
  return { type: "blank", sentenceId, blankAt, options: shuffle(options.slice(0, 4), seed) };
}

export function assembleLesson(lessonId: string, seenWordIds: readonly string[] = [], contentVersion = "1.0.0"): ExerciseItem[] {
  void contentVersion;
  const lesson = findLesson(lessonId)?.lesson;
  if (!lesson) return [];
  const seen = new Set(seenWordIds);
  const targets = [...lesson.targetWordIds, ...lesson.supportTargetIds];
  const items: ExerciseItem[] = [];
  const pool = introducedIds(lesson.id);

  if (lesson.presentation === "set") {
    items.push({ type: "teach-set", itemIds: targets, showGrammar: true });
    for (const id of targets) items.push(meaningItem(id, pool, `${lesson.id}:meaning:${id}`));
    const pinyinAt = new Set([0, 2, 4, targets.length - 1]);
    targets.forEach((id, index) => {
      if (pinyinAt.has(index)) items.push(pinyinItem(id, targets, pool, `${lesson.id}:pinyin:${id}`));
    });
    const buildSentence = setBuildSentence(lesson.sentenceIds);
    if (buildSentence) {
      const built = buildItem(buildSentence.id, `${lesson.id}:build:${buildSentence.id}`);
      if (built) items.push(built);
    }
    items.push(...toneItems(targets, true));
    return items;
  }

  let grammarShown = false;
  for (const id of targets) {
    if (!seen.has(id)) {
      items.push({ type: "teach", itemId: id, showGrammar: !grammarShown });
      grammarShown = true;
    }
  }
  for (const id of targets) items.push(meaningItem(id, pool, `${lesson.id}:meaning:${id}`));
  for (const id of targets) {
    if (!seen.has(id)) items.push(pinyinItem(id, targets, pool, `${lesson.id}:pinyin:${id}`));
  }

  items.push(...toneItems(targets, false));
  const buildSentence = sentenceWithTarget(targets, lesson.sentenceIds);
  const blankSentence =
    lesson.sentenceIds.map((id) => getSentence(id)).find((s) => s && s.id !== buildSentence?.id) ??
    buildSentence;
  if (buildSentence) {
    const built = buildItem(buildSentence.id, `${lesson.id}:build:${buildSentence.id}`);
    if (built) items.push(built);
  }
  if (blankSentence) {
    const blank = blankItem(blankSentence.id, targets, `${lesson.id}:blank:${blankSentence.id}`);
    if (blank) items.push(blank);
  }
  items.push(...radicalItems(lesson.id, targets));
  const stroke = strokeChar(targets);
  if (stroke) items.push({ type: "stroke", char: stroke });
  return items;
}

function toneItems(targets: string[], setLesson: boolean): ExerciseItem[] {
  const picked: { id: string; tone: number }[] = [];
  for (const id of targets) {
    const item = getLearnable(id);
    const tone = firstTone(id);
    if (!item || !tone) continue;
    const special = setLesson ? ["一", "四", "十"].includes(item.hanzi) : ["一", "不", "四"].includes(item.hanzi) || tone === 2 || tone === 3;
    if (special) picked.push({ id, tone });
  }
  const cap = setLesson ? picked.length : 2;
  return picked.slice(0, cap).map((row) => ({ type: "tone" as const, itemId: row.id, tone: row.tone }));
}

function radicalItems(lessonId: string, targets: string[]): ExerciseItem[] {
  const found: { char: string; radicalId: string }[] = [];
  for (const id of targets) {
    const hanzi = getLearnable(id)?.hanzi ?? "";
    const chars = [...hanzi];
    const look = chars.length === 1 ? chars : chars.slice(0, 1);
    for (const char of look) {
      const radical = radicalFor(char);
      if (radical && !found.some((row) => row.char === char)) found.push({ char, radicalId: radical.id });
    }
  }
  return found.slice(0, 2).map((row) => {
    const options = [row.radicalId];
    for (const radical of allRadicals()) {
      if (!options.includes(radical.id)) options.push(radical.id);
      if (options.length === 4) break;
    }
    return { type: "radical" as const, char: row.char, radicalId: row.radicalId, options: shuffle(options, `${lessonId}:rad:${row.char}`) };
  });
}

function strokeChar(targets: string[]): string | null {
  for (const id of targets) {
    const hanzi = getLearnable(id)?.hanzi ?? "";
    if ([...hanzi].length === 1) return hanzi;
  }
  const first = getLearnable(targets[0] ?? "")?.hanzi;
  return first ? [...first][0] ?? null : null;
}

export function assembleReview(unit: Unit, review: Review): ExerciseItem[] {
  const targetIds = [...new Set(unit.lessons.flatMap((lesson) => lesson.targetWordIds))];
  const items: ExerciseItem[] = [];
  const dialogue = getDialogue(review.dialogueId);
  for (const line of dialogue?.lines ?? []) {
    items.push({ type: "line", sentenceId: line.id });
  }
  const matchIds = targetIds.slice(0, 4);
  if (matchIds.length >= 2) items.push({ type: "match", itemIds: matchIds });
  for (const id of targetIds.slice(0, 8)) {
    items.push(meaningItem(id, targetIds, `${review.id}:meaning:${id}`));
  }
  const first = review.sentenceIds[0];
  const second = review.sentenceIds[1] ?? first;
  if (first) {
    const built = buildItem(first, `${review.id}:build:${first}`);
    if (built) items.push(built);
  }
  if (second) {
    const blank = blankItem(second, targetIds, `${review.id}:blank:${second}`);
    if (blank) items.push(blank);
  }
  return items;
}

export function lessonTargets(lesson: Lesson): string[] {
  return [...lesson.targetWordIds, ...lesson.supportTargetIds];
}

export function unitTargets(unit: Unit): string[] {
  return [...new Set(unit.lessons.flatMap((l) => lessonTargets(l)))];
}
