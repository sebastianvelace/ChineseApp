"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { exampleSentence, getLearnable, radicalFor } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";

export default function WordPage() {
  const params = useParams<{ itemId: string }>();
  const item = getLearnable(params.itemId);
  const { locale, pinyin, seen } = useProgress();
  const t = useT();
  if (!item || !seen.has(item.id)) {
    return (
      <main className="px-6 py-16">
        <p>{t("practice.noWords")}</p>
        <Link href="/practice" className="mt-4 inline-block font-semibold text-[#E25B45]">{t("lesson.back")}</Link>
      </main>
    );
  }
  const example = exampleSentence(item);
  const dictionary = item.senses[0]?.dictionaryExample;
  return (
    <main className="px-5 py-6">
      <Link href="/practice" className="text-sm font-semibold text-[#57534E]">‹</Link>
      <p className="mt-4 text-center font-[family-name:var(--font-hanzi)] text-7xl">{item.hanzi}</p>
      {pinyin ? <p className="mt-2 text-center text-xl text-[#57534E]">{item.pinyin}</p> : null}
      <p className="mt-3 text-center text-lg">{item.gloss[locale]}</p>
      {[...item.hanzi].map((char) => radicalFor(char)).filter(Boolean).slice(0, 1).map((radical) => (
        <p key={radical!.id} className="mx-auto mt-4 max-w-sm text-sm leading-5 text-[#57534E]">
          <span className="font-[family-name:var(--font-hanzi)] text-base text-[#1C1917]">{radical!.variant}</span> · {radical!.gloss[locale]}. {radical!.hint[locale]}
        </p>
      ))}
      {item.senses.slice(1).map((sense) => (
        <p key={sense.id} className="mt-2 text-center text-[#57534E]">{t("word.also")}: {sense.gloss[locale]}</p>
      ))}
      {example ? (
        <article className="mt-6 rounded-2xl bg-white p-4">
          <p className="font-[family-name:var(--font-hanzi)] text-xl">{example.hanzi}</p>
          {pinyin ? <p className="text-sm text-[#57534E]">{example.pinyin}</p> : null}
          <p className="mt-2">{example.translation[locale]}</p>
        </article>
      ) : null}
      {dictionary ? (
        <article className="mt-3 rounded-2xl bg-white p-4">
          <p className="text-xs font-semibold uppercase text-[#57534E]">{t("word.dictionary")}</p>
          {dictionary.lines.map((line, i) => (
            <p key={i} className="mt-2 font-[family-name:var(--font-hanzi)]">{line.hanzi}</p>
          ))}
          <p className="mt-2 text-[#57534E]">{dictionary.translation[locale]}</p>
        </article>
      ) : null}
      <Link href={`/practice/session?item=${item.id}`} className="btn-primary mt-6 inline-flex items-center justify-center">{t("word.practice")}</Link>
    </main>
  );
}
