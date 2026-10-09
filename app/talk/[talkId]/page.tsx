"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { findTalk, getLearnable } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { extraStatus } from "@/lib/unlock";

export default function TalkPage() {
  const params = useParams<{ talkId: string }>();
  const router = useRouter();
  const t = useT();
  const { ready, locale, passed, passNode } = useProgress();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const hit = findTalk(params.talkId);
  if (!ready) return <p className="p-6">{t("loading")}</p>;
  if (!hit) return <p className="p-6">Missing talk.</p>;
  if (extraStatus(hit.unit, hit.talk.id, passed) === "locked") {
    return (
      <main className="px-6 py-16">
        <h1 className="text-2xl font-bold">{t("unit.locked")}</h1>
        <button className="btn-primary mt-6" onClick={() => router.push(`/unit/${hit.unit.id}`)}>{t("lesson.back")}</button>
      </main>
    );
  }
  const checks = hit.talk.checks;
  const check = checks[step];
  if (!check) {
    return (
      <main className="px-6 py-16">
        <h1 className="text-3xl font-bold">{t("talk.done")}</h1>
        <p className="mt-2 text-[#C48A16]">{t("lesson.xp", { count: passed[hit.talk.id] ? 0 : 10 })}</p>
        <button className="btn-primary mt-8" onClick={() => router.push(`/unit/${hit.unit.id}`)}>{t("lesson.back")}</button>
      </main>
    );
  }
  const options = unique([check.answer, checks[1 - step]?.answer, getLearnable(hit.unit.lessons[0]?.targetWordIds[0] ?? "")?.hanzi].filter((v): v is string => !!v)).slice(0, 3);
  return (
    <main className="px-5 py-6">
      <button className="text-sm font-semibold text-[#57534E]" onClick={() => router.push(`/unit/${hit.unit.id}`)}>{t("lesson.leave")}</button>
      <h1 className="mt-3 text-2xl font-bold">{hit.talk.title[locale]}</h1>
      {step === 0 && picked === null ? <p className="mt-4 whitespace-pre-wrap text-[17px] leading-7">{hit.talk.body[locale]}</p> : null}
      <p className="mt-6 font-semibold">{check.prompt[locale]}</p>
      <div className="mt-3 flex flex-col gap-3">
        {options.map((option) => (
          <button key={option} className="min-h-12 rounded-xl bg-white px-4 text-left font-[family-name:var(--font-hanzi)] text-lg font-semibold" onClick={() => setPicked(option)}>
            {option}
          </button>
        ))}
      </div>
      {picked ? (
        <button
          className="btn-primary mt-6"
          onClick={() => {
            const last = step === checks.length - 1;
            setPicked(null);
            if (last) {
              passNode(hit.talk.id, "talk");
              setStep(checks.length);
            } else setStep(step + 1);
          }}
        >
          {t("lesson.continue")}
        </button>
      ) : null}
    </main>
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
