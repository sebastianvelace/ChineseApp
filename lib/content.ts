import curriculumJson from "@/content/curriculum.json";
import sentencesJson from "@/content/hsk1-sentences.json";
import wordsJson from "@/content/hsk1-words.json";
import type { Learnable, Lesson, Review, Sentence, Support, Talk, Track, Unit, Word } from "./types";

const tracks = (curriculumJson as { tracks: Track[] }).tracks;
const words = (wordsJson as { words: Word[] }).words;
const support = (wordsJson as { support: Support[] }).support;
const sentences = (sentencesJson as { sentences: Sentence[] }).sentences;
const dialogues = (sentencesJson as { dialogues: { id: string; unitId: string; lines: Sentence[] }[] }).dialogues;

const wordById = new Map(words.map((w) => [w.id, w]));
const supportById = new Map(support.map((s) => [s.id, s]));
const sentenceById = new Map(sentences.map((s) => [s.id, s]));
for (const dialogue of dialogues) {
  for (const line of dialogue.lines) sentenceById.set(line.id, line);
}
const units: Unit[] = tracks.flatMap((t) => t.levels.flatMap((l) => l.units));
const unitById = new Map(units.map((u) => [u.id, u]));

export function allTracks(): Track[] {
  return tracks;
}

export function trackById(id: string): Track | undefined {
  return tracks.find((t) => t.id === id);
}

export function allUnits(): Unit[] {
  return units;
}

export function getUnit(id: string): Unit | undefined {
  return unitById.get(id);
}

export function getSentence(id: string): Sentence | undefined {
  return sentenceById.get(id);
}

export function getDialogue(id: string) {
  return dialogues.find((d) => d.id === id);
}

export function getLearnable(id: string): Learnable | undefined {
  const word = wordById.get(id);
  if (word) {
    return {
      id: word.id,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      gloss: word.senses[0]?.gloss ?? { en: word.hanzi, es: word.hanzi },
      senses: word.senses,
      teachSentenceId: word.teachSentenceId,
    };
  }
  const extra = supportById.get(id);
  if (!extra) return undefined;
  return {
    id: extra.id,
    hanzi: extra.hanzi,
    pinyin: extra.pinyin,
    gloss: extra.gloss,
    senses: [],
    teachSentenceId: null,
  };
}

export function allLearnableIds(): string[] {
  return [...words.map((w) => w.id), ...support.filter((s) => s.srs).map((s) => s.id)];
}

export function findLesson(id: string): { unit: Unit; lesson: Lesson } | undefined {
  for (const unit of units) {
    const lesson = unit.lessons.find((l) => l.id === id);
    if (lesson) return { unit, lesson };
  }
  return undefined;
}

export function findReview(id: string): { unit: Unit; review: Review } | undefined {
  for (const unit of units) {
    if (unit.review.id === id) return { unit, review: unit.review };
  }
  return undefined;
}

export function findTalk(id: string): { unit: Unit; talk: Talk } | undefined {
  for (const unit of units) {
    if (unit.teacherTalk.id === id) return { unit, talk: unit.teacherTalk };
  }
  return undefined;
}

export function contentTokens(sentence: Sentence) {
  return sentence.tokens.filter((t) => t.kind !== "punct");
}

export function exampleSentence(item: Learnable): Sentence | undefined {
  if (item.teachSentenceId) return sentenceById.get(item.teachSentenceId);
  return sentences.find((s) => s.hanzi.includes(item.hanzi));
}
