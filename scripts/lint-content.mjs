import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? join(process.cwd(), "content");
const errors = [];

function load(name) {
  try {
    return JSON.parse(readFileSync(join(dir, name), "utf8"));
  } catch (error) {
    errors.push(`${name}: ${error instanceof Error ? error.message : "unreadable"}`);
    return null;
  }
}

function sameSet(label, actual, expected) {
  const left = new Set(actual);
  const right = new Set(expected);
  for (const id of left) if (!right.has(id)) errors.push(`${label} has ${id} but id-index.json does not`);
  for (const id of right) if (!left.has(id)) errors.push(`id-index.json lists ${id} but ${label} does not`);
}

function walk(node, path, visit) {
  if (!node || typeof node !== "object") return;
  visit(node, path);
  if (Array.isArray(node)) {
    node.forEach((item, index) => walk(item, `${path}[${index}]`, visit));
    return;
  }
  for (const [key, value] of Object.entries(node)) walk(value, `${path}.${key}`, visit);
}

const wordsFile = load("hsk1-words.json");
const curriculum = load("curriculum.json");
const sentencesFile = load("hsk1-sentences.json");
const radicalsFile = load("radicals.json");
const indexFile = load("id-index.json");

if (wordsFile && curriculum && sentencesFile && radicalsFile && indexFile) {
  const words = wordsFile.words ?? [];
  const support = wordsFile.support ?? [];
  const sentences = sentencesFile.sentences ?? [];
  const dialogues = sentencesFile.dialogues ?? [];
  const radicals = radicalsFile.radicals ?? [];
  const units = (curriculum.tracks ?? []).flatMap((track) => (track.levels ?? []).flatMap((level) => level.units ?? []));
  const lessons = units.flatMap((unit) => unit.lessons ?? []);
  const talks = units.map((unit) => unit.teacherTalk).filter(Boolean);
  const reviews = units.map((unit) => unit.review).filter(Boolean);

  const wordIds = new Set(words.map((word) => word.id));
  const supportIds = new Set(support.map((item) => item.id));
  const sentenceIds = new Set(sentences.map((sentence) => sentence.id));
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

  if (words.length !== 150) errors.push(`expected 150 words, found ${words.length}`);
  const indexes = words.map((word) => word.hskIndex).sort((a, b) => a - b);
  if (indexes.some((value, index) => value !== index + 1)) errors.push("HSK indexes must be 1 through 150");
  if (new Set(words.map((word) => word.id)).size !== words.length) errors.push("word ids are not unique");
  if (new Set(words.map((word) => word.hanzi)).size !== words.length) errors.push("word hanzi are not unique");

  for (const word of words) {
    const lesson = lessonById.get(word.canonicalLessonId);
    if (!lesson) errors.push(`${word.id} canonical lesson ${word.canonicalLessonId} is missing`);
    else if (![...lesson.targetWordIds, ...lesson.supportTargetIds].includes(word.id)) {
      errors.push(`${word.canonicalLessonId} does not list ${word.id}`);
    }
    if (word.teachSentenceId && !sentenceIds.has(word.teachSentenceId)) errors.push(`${word.id} teach sentence ${word.teachSentenceId} is missing`);
  }

  for (const unit of units) {
    const hsk = unit.trackId === "hsk";
    for (const lesson of unit.lessons ?? []) {
      for (const id of lesson.targetWordIds ?? []) {
        if (hsk && !wordIds.has(id)) errors.push(`${lesson.id} HSK target ${id} is not a word`);
        if (!hsk && !wordIds.has(id) && !supportIds.has(id)) errors.push(`${lesson.id} target ${id} is not a word`);
      }
      for (const id of lesson.supportTargetIds ?? []) {
        if (!supportIds.has(id)) errors.push(`${lesson.id} support target ${id} is missing`);
      }
      for (const id of lesson.sentenceIds ?? []) {
        if (!sentenceIds.has(id)) errors.push(`${lesson.id} sentence ${id} is missing`);
      }
    }
    for (const id of unit.review?.sentenceIds ?? []) {
      if (!sentenceIds.has(id)) errors.push(`${unit.review.id} sentence ${id} is missing`);
    }
    if (unit.review?.dialogueId && !dialogues.some((dialogue) => dialogue.id === unit.review.dialogueId)) {
      errors.push(`${unit.review.id} dialogue ${unit.review.dialogueId} is missing`);
    }
  }

  function checkTokens(tokens, path) {
    for (const token of tokens ?? []) {
      if (token.kind === "word" && !wordIds.has(token.wordId)) errors.push(`${path} token ${token.text} is not a word`);
      if (token.kind === "support" && !supportIds.has(token.supportId)) errors.push(`${path} token ${token.text} is not support`);
    }
  }
  for (const sentence of sentences) checkTokens(sentence.tokens, sentence.id);
  for (const dialogue of dialogues) for (const line of dialogue.lines ?? []) checkTokens(line.tokens, line.id);
  for (const word of words) {
    for (const sense of word.senses ?? []) {
      for (const line of sense.dictionaryExample?.lines ?? []) checkTokens(line.tokens, `${word.id} dictionary`);
    }
  }

  const files = { words: wordsFile, curriculum, sentences: sentencesFile, radicals: radicalsFile };
  for (const [label, file] of Object.entries(files)) {
    walk(file, label, (node, path) => {
      if (!node || typeof node !== "object" || Array.isArray(node)) return;
      if ("en" in node || "es" in node) {
        if (typeof node.en !== "string" || node.en.trim() === "" || typeof node.es !== "string" || node.es.trim() === "") {
          errors.push(`${path} needs non-empty en and es`);
        }
      }
      if ("audio" in node && node.audio !== null) errors.push(`${path}.audio must be null in v1`);
    });
  }

  const listed = indexFile.ids ?? {};
  sameSet("words", [...wordIds], listed.words ?? []);
  sameSet("support", [...supportIds], listed.support ?? []);
  sameSet("lessons", lessons.map((lesson) => lesson.id), listed.lessons ?? []);
  sameSet("units", units.map((unit) => unit.id), listed.units ?? []);
  sameSet("talks", talks.map((talk) => talk.id), listed.talks ?? []);
  sameSet("reviews", reviews.map((review) => review.id), listed.reviews ?? []);
  sameSet("dialogues", dialogues.map((dialogue) => dialogue.id), listed.dialogues ?? []);
  sameSet("radicals", radicals.map((radical) => radical.id), listed.radicals ?? []);

  const seen = new Map();
  function claim(id, source) {
    if (!id) return;
    const previous = seen.get(id);
    if (previous) errors.push(`duplicate id ${id} in ${previous} and ${source}`);
    else seen.set(id, source);
  }
  for (const id of wordIds) claim(id, "words");
  for (const id of supportIds) claim(id, "support");
  for (const lesson of lessons) claim(lesson.id, "lessons");
  for (const talk of talks) claim(talk.id, "talks");
  for (const review of reviews) claim(review.id, "reviews");
  for (const dialogue of dialogues) claim(dialogue.id, "dialogues");
  for (const sentence of sentences) claim(sentence.id, "sentences");
  for (const dialogue of dialogues) for (const line of dialogue.lines ?? []) claim(line.id, "sentences");
  for (const radical of radicals) claim(radical.id, "radicals");
}

if (errors.length) {
  for (const error of errors) console.error(error);
  console.error(`${errors.length} content error${errors.length === 1 ? "" : "s"}`);
  process.exit(1);
}
console.log(`content ok (${dir})`);
