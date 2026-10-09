export type Locale = "en" | "es";
export type Localized = { en: string; es: string };

export type Token = {
  kind: string;
  text: string;
  pinyin?: string;
  wordId?: string;
  supportId?: string;
  variantOf?: string;
};

export type Sentence = {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: Localized;
  tokens: Token[];
  speaker?: string;
};

export type Sense = {
  id: string;
  pos: string;
  gloss: Localized;
  dictionaryExample?: {
    translation: Localized;
    lines: { hanzi: string; pinyin: string; speaker: string | null }[];
  };
};

export type Word = {
  id: string;
  hanzi: string;
  pinyin: string;
  senses: Sense[];
  teachSentenceId: string | null;
  canonicalLessonId: string;
};

export type Support = {
  id: string;
  hanzi: string;
  pinyin: string;
  gloss: Localized;
  srs: boolean;
  canonicalLessonId: string | null;
};

export type Lesson = {
  id: string;
  kind: "lesson";
  order: number;
  presentation: "standard" | "set";
  title: Localized;
  targetWordIds: string[];
  supportTargetIds: string[];
  grammar: { id: string; pattern: string; title: Localized; body: Localized };
  sentenceIds: string[];
  estimatedMinutes: number;
};

export type Talk = {
  id: string;
  kind: "teacherTalk";
  title: Localized;
  body: Localized;
  checks: { id: string; prompt: Localized; answer: string }[];
  estimatedMinutes: number;
};

export type Review = {
  id: string;
  kind: "review";
  title: Localized;
  sentenceIds: string[];
  dialogueId: string;
  estimatedMinutes: number;
};

export type Unit = {
  id: string;
  slug: string;
  trackId: string;
  levelId: string;
  order: number;
  title: Localized;
  icon: string;
  color: string;
  requiresUnitId: string | null;
  lessons: Lesson[];
  teacherTalk: Talk;
  review: Review;
};

export type Track = {
  id: string;
  title: Localized;
  levels: { id: string; title: Localized; units: Unit[] }[];
};

export type Learnable = {
  id: string;
  hanzi: string;
  pinyin: string;
  gloss: Localized;
  senses: Sense[];
  teachSentenceId: string | null;
};

export type TeachItem = { type: "teach"; itemId: string; showGrammar: boolean };
export type TeachSetItem = { type: "teach-set"; itemIds: string[]; showGrammar: boolean };
export type MeaningItem = { type: "meaning"; itemId: string; options: string[] };
export type PinyinItem = { type: "pinyin"; itemId: string; options: string[] };
export type BuildItem = { type: "build"; sentenceId: string; order: number[] };
export type BlankItem = { type: "blank"; sentenceId: string; blankAt: number; options: string[] };
export type LineItem = { type: "line"; sentenceId: string };

export type ExerciseItem =
  | TeachItem
  | TeachSetItem
  | MeaningItem
  | PinyinItem
  | BuildItem
  | BlankItem
  | LineItem;

export function isGraded(item: ExerciseItem): boolean {
  return item.type === "meaning" || item.type === "pinyin" || item.type === "build" || item.type === "blank";
}
