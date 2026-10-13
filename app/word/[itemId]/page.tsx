"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingRows } from "@/components/LoadingRows";
import { SpeechButton } from "@/components/SpeechButton";
import { StrokeReplay } from "@/components/StrokePad";
import { TokenLine } from "@/components/TokenLine";
import { exampleSentence, getLearnable, radicalFor } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { openOffline } from "@/lib/warm-shell";

export default function WordPage() {
  const params = useParams<{ itemId: string }>();
  const router = useRouter();
  const item = getLearnable(params.itemId);
  const { ready, locale, pinyin, seen, cards } = useProgress();
  const t = useT();
  const missing = !item || !seen.has(item.id);
  useEffect(() => {
    if (ready && missing) router.replace("/practice");
  }, [ready, missing, router]);
  if (!ready || missing) return <LoadingRows />;
  const example = exampleSentence(item);
  const dictionary = item.senses[0]?.dictionaryExample;
  const radicals = [...item.hanzi].flatMap((char) => {
    const radical = radicalFor(char);
    return radical ? [radical] : [];
  }).filter((radical, index, list) => list.findIndex((row) => row.id === radical.id) === index);
  return (
    <main className="px-5 py-6">
      <Link href="/practice" aria-label={t("lesson.back")} onClick={(event) => openOffline(event, "/practice")} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#57534E]">
        <ChevronLeft size={22} aria-hidden />
      </Link>
      <div className="mt-4 flex items-center justify-center gap-3">
        <p className="text-center font-[family-name:var(--font-hanzi)] text-7xl">{item.hanzi}</p>
        <SpeechButton text={item.hanzi} />
      </div>
      {pinyin ? <p className="mt-2 text-center text-lg text-[#57534E]">{item.pinyin}</p> : null}
      <p className="mt-3 text-center text-lg">{item.gloss[locale]}</p>
      {radicals.length ? (
        <ul className="mx-auto mt-4 flex max-w-sm flex-col gap-2">
          {radicals.map((radical) => (
            <li key={radical.id} className="rounded-2xl bg-white px-4 py-3 text-base leading-6 text-[#57534E]">
              <span className="font-[family-name:var(--font-hanzi)] text-[22px] text-[#1C1917]">{radical.variant}</span> · {radical.gloss[locale]}. {radical.hint[locale]}
            </li>
          ))}
        </ul>
      ) : null}
      {item.senses.slice(1).map((sense) => (
        <p key={sense.id} className="mt-2 text-center text-[#57534E]">{t("word.also")}: {sense.gloss[locale]}</p>
      ))}
      <h2 className="mt-6 text-sm font-semibold text-[#57534E]">{t("word.strokes")}</h2>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {[...item.hanzi].map((char, index) => (
          <StrokeReplay key={`${char}-${index}`} char={char} />
        ))}
      </div>
      {example ? (
        <article className="mt-6 rounded-2xl bg-white p-4">
          <TokenLine tokens={example.tokens} />
          {pinyin ? <p className="text-lg text-[#57534E]">{example.pinyin}</p> : null}
          <p className="mt-2">{example.translation[locale]}</p>
        </article>
      ) : null}
      {dictionary ? (
        <article className="mt-3 rounded-2xl border border-[#E7E0D6] bg-[#F3EFE8] px-4 py-3 text-[#57534E]">
          <p className="text-sm font-semibold uppercase tracking-wide">{t("word.dictionary")}</p>
          {dictionary.lines.map((line, i) => (
            <div key={i} className="mt-2">
              {line.speaker ? <p className="text-sm font-semibold">{line.speaker}</p> : null}
              {line.tokens ? <TokenLine tokens={line.tokens} /> : <p className="font-[family-name:var(--font-hanzi)] text-[22px]">{line.hanzi}</p>}
              {pinyin && line.pinyin ? <p className="text-lg">{line.pinyin}</p> : null}
            </div>
          ))}
          <p className="mt-2 text-base">{dictionary.translation[locale]}</p>
        </article>
      ) : null}
      {cards.some((card) => card.itemId === item.id) ? (
        <Link href={`/practice/session?item=${item.id}`} onClick={(event) => openOffline(event, `/practice/session?item=${item.id}`)} className="btn-primary mt-6 inline-flex items-center justify-center">{t("word.practice")}</Link>
      ) : null}
    </main>
  );
}
