"use client";

import { useProgress, type Locale } from "./progress";

const STR: Record<Locale, Record<string, string>> = {
  en: {
    "app.tagline": "Learn Chinese, one step at a time.",
    "nav.learn": "Learn",
    "nav.practice": "Practice",
    "nav.me": "Me",
    "onboarding.start": "Start",
    "onboarding.pinyin": "Pinyin",
    "onboarding.shown": "Shown",
    "onboarding.hidden": "Hidden",
    "onboarding.language": "Language",
    "track.hsk": "HSK",
    "track.everyday": "Everyday",
    "unit.lesson": "Lesson {order}",
    "unit.further": "One step further",
    "unit.talk": "Teacher Talk",
    "unit.review": "Review",
    "unit.locked": "Locked",
    "unit.done": "Done",
    "unit.progress": "{done} of {total} lessons",
    "lesson.check": "Check",
    "lesson.continue": "Continue",
    "lesson.correct": "Correct",
    "lesson.wrong": "Answer",
    "lesson.showPinyin": "Show pinyin",
    "lesson.passTitle": "Lesson complete",
    "lesson.failTitle": "Not yet",
    "lesson.retry": "Retry",
    "lesson.back": "Back",
    "lesson.next": "Next lesson",
    "lesson.nextUnit": "Next unit",
    "lesson.leaveTitle": "Leave lesson?",
    "lesson.leaveBody": "This attempt won't be saved.",
    "tone.prompt": "Which tone is the first syllable?",
    "tone.1": "1 · high",
    "tone.2": "2 · rising",
    "tone.3": "3 · low",
    "tone.4": "4 · falling",
    "tone.5": "neutral",
    "radical.prompt": "Which part hints at the meaning?",
    "stroke.giveUp": "Show me",
    "stroke.loading": "Loading strokes…",
    "stroke.missing": "Stroke data isn't available right now.",
    "match.prompt": "Match each word",
    "lesson.xp": "{count} XP",
    "lesson.leave": "Leave",
    "practice.due": "{count} due",
    "practice.review": "Review",
    "practice.continue": "Continue learning",
    "practice.words": "Words you've learned",
    "practice.none": "Nothing due",
    "practice.noneBody": "Pass a lesson and new words will wait here.",
    "practice.noWords": "No words yet. Finish a lesson on the Learn tab.",
    "practice.search": "Search",
    "practice.done": "Session done",
    "practice.remembered": "{count} remembered",
    "word.also": "Also",
    "word.dictionary": "Dictionary",
    "word.practice": "Practice this word",
    "me.goal": "Daily goal",
    "me.language": "Language",
    "me.pinyin": "Pinyin",
    "me.account": "Saved on this phone",
    "me.level": "Level {level} · {title}",
    "me.words": "{count} words",
    "streak.freezes": "{count} streak freezes",
    "local.banner": "Progress stays on this phone.",
    "locked.body": "Finish the previous lesson to open this one.",
    "talk.done": "Done",
    "loading": "Loading…",
  },
  es: {
    "app.tagline": "Aprende chino, paso a paso.",
    "nav.learn": "Aprender",
    "nav.practice": "Practicar",
    "nav.me": "Yo",
    "onboarding.start": "Empezar",
    "onboarding.pinyin": "Pinyin",
    "onboarding.shown": "Visible",
    "onboarding.hidden": "Oculto",
    "onboarding.language": "Idioma",
    "track.hsk": "HSK",
    "track.everyday": "Día a día",
    "unit.lesson": "Lección {order}",
    "unit.further": "Un paso más",
    "unit.talk": "Nota cultural",
    "unit.review": "Repaso",
    "unit.locked": "Bloqueada",
    "unit.done": "Lista",
    "unit.progress": "{done} de {total} lecciones",
    "lesson.check": "Comprobar",
    "lesson.continue": "Seguir",
    "lesson.correct": "Correcto",
    "lesson.wrong": "Respuesta",
    "lesson.showPinyin": "Ver pinyin",
    "lesson.passTitle": "Lección completa",
    "lesson.failTitle": "Todavía no",
    "lesson.retry": "Reintentar",
    "lesson.back": "Volver",
    "lesson.next": "Siguiente lección",
    "lesson.nextUnit": "Siguiente unidad",
    "lesson.leaveTitle": "¿Salir de la lección?",
    "lesson.leaveBody": "Este intento no se guarda.",
    "tone.prompt": "¿Qué tono tiene la primera sílaba?",
    "tone.1": "1 · alto",
    "tone.2": "2 · ascendente",
    "tone.3": "3 · bajo",
    "tone.4": "4 · descendente",
    "tone.5": "neutro",
    "radical.prompt": "¿Qué parte insinúa el significado?",
    "stroke.giveUp": "Muéstrame",
    "stroke.loading": "Cargando trazos…",
    "stroke.missing": "Los trazos no están disponibles ahora.",
    "match.prompt": "Empareja cada palabra",
    "lesson.xp": "{count} XP",
    "lesson.leave": "Salir",
    "practice.due": "{count} pendientes",
    "practice.review": "Repasar",
    "practice.continue": "Seguir aprendiendo",
    "practice.words": "Palabras que ya viste",
    "practice.none": "Nada pendiente",
    "practice.noneBody": "Aprueba una lección y las palabras nuevas esperan aquí.",
    "practice.noWords": "Todavía no hay palabras. Termina una lección en Aprender.",
    "practice.search": "Buscar",
    "practice.done": "Sesión lista",
    "practice.remembered": "{count} recordadas",
    "word.also": "También",
    "word.dictionary": "Diccionario",
    "word.practice": "Practicar esta palabra",
    "me.goal": "Meta diaria",
    "me.language": "Idioma",
    "me.pinyin": "Pinyin",
    "me.account": "Guardado en este teléfono",
    "me.level": "Nivel {level} · {title}",
    "me.words": "{count} palabras",
    "streak.freezes": "{count} protecciones de racha",
    "local.banner": "El progreso se queda en este teléfono.",
    "locked.body": "Termina la lección anterior para abrir esta.",
    "talk.done": "Listo",
    "loading": "Cargando…",
  },
};

const LEVELS = [
  { xp: 0, en: "Beginner", es: "Principiante" },
  { xp: 50, en: "Student", es: "Estudiante" },
  { xp: 150, en: "Regular", es: "Constante" },
  { xp: 400, en: "Committed", es: "Entregado" },
  { xp: 800, en: "Scholar", es: "Estudioso" },
];

export function levelFor(xp: number, locale: Locale): { level: number; title: string } {
  let level = 1;
  let title = LEVELS[0]?.[locale] ?? "Beginner";
  LEVELS.forEach((row, index) => {
    if (xp >= row.xp) {
      level = index + 1;
      title = row[locale];
    }
  });
  if (xp >= 800) level = 5 + Math.floor((xp - 800) / 400);
  return { level, title };
}

export function useT() {
  const { locale } = useProgress();
  return (key: string, vars?: Record<string, string | number>) => {
    let text = STR[locale][key] ?? STR.en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  };
}
