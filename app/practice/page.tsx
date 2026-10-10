"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LoadingRows } from "@/components/LoadingRows";
import { getLearnable, trackById } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { practiceQueue } from "@/lib/practice-queue";
import { resumeHref } from "@/lib/unlock";

export default function PracticePage() {
  const { ready, cards, seen, seenItems, locale, pinyin, track, passed } = useProgress();
  const t = useT();
  const [query, setQuery] = useState("");
  const due = useMemo(() => practiceQueue(cards, seenItems), [cards, seenItems]);
  if (!ready) return <LoadingRows />;
  const words = [...seen].map((id) => getLearnable(id)).filter((item) => !!item);
  const filtered = words.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const digits = item.pinyinNumbered.toLowerCase();
    return item.hanzi.includes(query.trim()) || item.pinyin.toLowerCase().includes(q) || digits.includes(q) || item.gloss[locale].toLowerCase().includes(q);
  });
  return (
    <main className="px-5 py-6">
      <h1 className="text-3xl font-bold">{t("nav.practice")}</h1>
      {due.length ? (
        <>
          <p className="mt-6 text-lg font-semibold">{t("practice.due", { count: due.length })}</p>
          <Link href="/practice/session" className="btn-primary mt-3 inline-flex items-center justify-center">{t("practice.review")}</Link>
        </>
      ) : (
        <div className="mt-6">
          <p className="text-lg font-semibold">{t("practice.none")}</p>
          <p className="mt-1 text-[#57534E]">{words.length ? t("practice.noneBody") : t("practice.noWords")}</p>
          {resumeHref(trackById(track)?.levels[0]?.units ?? [], passed) ? (
            <Link href={resumeHref(trackById(track)?.levels[0]?.units ?? [], passed) ?? "/learn"} className="btn-primary mt-3 inline-flex items-center justify-center">
              {t("practice.continue")}
            </Link>
          ) : null}
        </div>
      )}
      <h2 className="mt-8 font-semibold">{t("practice.words")} · {words.length}</h2>
      <input className="mt-3 w-full rounded-xl border border-[#E7E0D6] bg-white px-4 py-3 text-base" type="search" aria-label={t("practice.search")} placeholder={t("practice.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
      {query.trim() && filtered.length === 0 ? <p className="mt-3 text-base text-[#57534E]">{t("practice.noMatch")}</p> : null}
      <ul className="mt-3 flex flex-col gap-2">
        {filtered.map((item) => (
          <li key={item.id}>
            <Link href={`/word/${item.id}`} className="flex items-baseline justify-between gap-3 rounded-2xl bg-white px-4 py-3">
              <span className="font-[family-name:var(--font-hanzi)] text-[22px] font-medium">{item.hanzi}</span>
              <span className="text-base">
                {pinyin ? <span className="mr-2 text-lg text-[#57534E]">{item.pinyin}</span> : null}
                {item.gloss[locale]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
