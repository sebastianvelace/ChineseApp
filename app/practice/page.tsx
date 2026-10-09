"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getLearnable } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { dueCards, useProgress } from "@/lib/progress";

export default function PracticePage() {
  const { ready, cards, seen, locale, pinyin } = useProgress();
  const t = useT();
  const [query, setQuery] = useState("");
  const due = useMemo(() => dueCards(cards), [cards]);
  if (!ready) return <p className="p-6">{t("loading")}</p>;
  const words = [...seen].map((id) => getLearnable(id)).filter((item) => !!item);
  const filtered = words.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.hanzi.includes(query.trim()) || item.pinyin.toLowerCase().includes(q) || item.gloss[locale].toLowerCase().includes(q);
  });
  return (
    <main className="px-5 py-6">
      <h1 className="text-3xl font-bold">{t("nav.practice")}</h1>
      <p className="mt-6 text-lg font-semibold">{t("practice.due", { count: due.length })}</p>
      {due.length ? (
        <Link href="/practice/session" className="btn-primary mt-3 inline-flex items-center justify-center">{t("practice.review")}</Link>
      ) : (
        <p className="mt-2 text-[#57534E]">{words.length ? t("practice.noneBody") : t("practice.noWords")}</p>
      )}
      <h2 className="mt-8 font-semibold">{t("practice.words")} · {words.length}</h2>
      <input className="mt-3 w-full rounded-xl border border-[#E7E0D6] bg-white px-4 py-3" placeholder={t("practice.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul className="mt-3 flex flex-col gap-2">
        {filtered.map((item) => (
          <li key={item.id}>
            <Link href={`/word/${item.id}`} className="flex items-baseline justify-between rounded-2xl bg-white px-4 py-3">
              <span className="font-[family-name:var(--font-hanzi)] text-2xl">{item.hanzi}</span>
              <span className="text-sm text-[#57534E]">{pinyin ? item.pinyin : ""} {item.gloss[locale]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
