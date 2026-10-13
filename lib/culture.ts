import type { Localized } from "./types";

export type CultureFact = {
  id: string;
  hanzi: string;
  title: Localized;
  body: Localized;
};

export const CULTURE_FACTS: CultureFact[] = [
  {
    id: "names-family-first",
    hanzi: "王小明",
    title: { en: "Names start with family", es: "El apellido va primero" },
    body: {
      en: "In a typical Chinese name, the family name comes first. 王小明 reads as Wang Xiaoming, not Xiaoming Wang.",
      es: "En un nombre chino típico, el apellido va primero. 王小明 se lee Wang Xiaoming, no Xiaoming Wang.",
    },
  },
  {
    id: "hello-builds-a-sentence",
    hanzi: "你好",
    title: { en: "A greeting you can see", es: "Un saludo que se puede leer" },
    body: {
      en: "你好 combines 你 (you) and 好 (good). Many useful Chinese phrases become easier when you notice the meaning of each character.",
      es: "你好 combina 你 (tú) y 好 (bueno). Muchas frases útiles se entienden mejor cuando observás el sentido de cada carácter.",
    },
  },
  {
    id: "bright-character",
    hanzi: "明",
    title: { en: "Characters can tell tiny stories", es: "Los caracteres cuentan historias pequeñas" },
    body: {
      en: "明 means bright and is built from 日 (sun) and 月 (moon). Character parts often give you a memory hook, even when they are not a literal definition.",
      es: "明 significa brillante y está formado por 日 (sol) y 月 (luna). Las partes de un carácter pueden darte una ayuda para recordarlo, aunque no sean una definición literal.",
    },
  },
  {
    id: "tea-word",
    hanzi: "茶",
    title: { en: "茶 is more than a flashcard", es: "茶 es más que una tarjeta" },
    body: {
      en: "茶 means tea. In daily life, tea is commonly offered to guests, so this small word opens the door to a very practical social moment.",
      es: "茶 significa té. En la vida cotidiana, ofrecer té a una visita es un gesto habitual, así que esta palabra abre una situación social muy práctica.",
    },
  },
  {
    id: "calligraphy-practice",
    hanzi: "书法",
    title: { en: "Writing is also movement", es: "Escribir también es movimiento" },
    body: {
      en: "书法 means calligraphy. Stroke order is not only about looking correct: it gives the hand a repeatable rhythm for writing characters.",
      es: "书法 significa caligrafía. El orden de trazos no sirve solo para que algo se vea correcto: le da a la mano un ritmo repetible para escribir.",
    },
  },
  {
    id: "red-celebration",
    hanzi: "红",
    title: { en: "Red carries a warm signal", es: "El rojo transmite calidez" },
    body: {
      en: "红 means red. In many celebrations, red is used to suggest joy and good fortune, so color vocabulary can carry cultural context too.",
      es: "红 significa rojo. En muchas celebraciones, el rojo se usa para transmitir alegría y buena fortuna; el vocabulario de colores también tiene contexto cultural.",
    },
  },
];

export function dailyCultureFact(date = new Date()): CultureFact {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return CULTURE_FACTS[((day % CULTURE_FACTS.length) + CULTURE_FACTS.length) % CULTURE_FACTS.length] as CultureFact;
}
