"use client";

import { X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OfflineLesson } from "@/components/OfflineLesson";
import { Sheet } from "@/components/Sheet";
import { findTalk, getLearnable } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { useSavedHere } from "@/lib/saved-here";
import { talkAnswerMatches, talkChoices } from "@/lib/talk-choices";
import { extraStatus } from "@/lib/unlock";

export default function TalkPage() {
  const params = useParams<{ talkId: string }>();
  const router = useRouter();
  const t = useT();
  const { ready, locale, passed, passNode } = useProgress();
  const saved = useSavedHere(params.talkId);
  const [phase, setPhase] = useState<"read" | "check" | "end">("read");
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const replay = useRef<boolean | null>(null);
  const hit = findTalk(params.talkId);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase, step]);
  if (!ready || saved === "loading") return <p className="p-6">{t("loading")}</p>;
  if (hit && replay.current === null) replay.current = !!passed[hit.talk.id];
  if (saved === "missing") return <OfflineLesson />;
  if (!hit) return <p className="p-6 text-base">{t("missing.talk")}</p>;
  if (extraStatus(hit.unit, hit.talk.id, passed) === "locked") {
    return (
      <main className="px-6 py-16">
        <h1 className="text-2xl font-bold">{t("unit.locked")}</h1>
        <button className="btn-primary mt-6" onClick={() => router.push(`/unit/${hit.unit.id}`)}>{t("lesson.back")}</button>
      </main>
    );
  }

  const checks = hit.talk.checks;
  const leave = leaving ? (
    <Sheet title={t("lesson.leaveTitle")} closeLabel={t("sheet.close")} onClose={() => setLeaving(false)}>
      <p className="text-base text-[#57534E]">{t("lesson.leaveBody")}</p>
      <button type="button" className="btn-primary mt-6" onClick={() => router.push(`/unit/${hit.unit.id}`)}>{t("lesson.leave")}</button>
    </Sheet>
  ) : null;

  if (phase === "end") {
    return (
      <main className="px-6 py-16">
        <h1 className="text-3xl font-bold">{t("talk.done")}</h1>
        <p className="mt-2 text-[#C48A16]">{t("lesson.xp", { count: replay.current ? 0 : 10 })}</p>
        <button className="btn-primary mt-8" onClick={() => router.push(`/unit/${hit.unit.id}`)}>{t("lesson.back")}</button>
      </main>
    );
  }

  if (phase === "read") {
    return (
      <main className="flex min-h-full flex-col px-5 py-6">
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-[#57534E]" aria-label={t("lesson.leave")} onClick={() => setLeaving(true)}>
          <X size={22} aria-hidden />
        </button>
        <h1 className="mt-3 text-2xl font-bold">{hit.talk.title[locale]}</h1>
        <p className="mt-4 whitespace-pre-wrap text-base leading-7">{hit.talk.body[locale]}</p>
        <button type="button" className="btn-primary mt-8" onClick={() => setPhase("check")}>{t("lesson.continue")}</button>
        {leave}
      </main>
    );
  }

  const check = checks[step];
  if (!check) return <p className="p-6 text-base">{t("missing.talk")}</p>;
  const other = checks.find((item, index) => index !== step)?.answer;
  const hanzi = hit.unit.lessons.flatMap((lesson) => lesson.targetWordIds).map((id) => getLearnable(id)?.hanzi).filter((text): text is string => !!text);
  const options = talkChoices(check.answer, other, hanzi);
  const last = step === checks.length - 1;
  return (
    <main className="flex min-h-full flex-col px-5 py-6">
      <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-[#57534E]" aria-label={t("lesson.leave")} onClick={() => setLeaving(true)}>
        <X size={22} aria-hidden />
      </button>
      <h1 className="mt-3 text-2xl font-bold">{hit.talk.title[locale]}</h1>
      <p className="mt-6 text-base font-semibold">{check.prompt[locale]}</p>
      <div className="mt-3 flex flex-col gap-3">
        {options.map((option) => {
          const correct = picked !== null && talkAnswerMatches(option, check.answer);
          const wrong = picked === option && !talkAnswerMatches(option, check.answer);
          const border = correct ? "border-[#1F8A70]" : wrong ? "border-[#9F1239]" : "border-[#E7E0D6]";
          return (
            <button type="button" key={option} aria-pressed={picked === option} disabled={picked !== null} className={`select-ease min-h-12 rounded-xl border-2 bg-white px-4 text-left font-[family-name:var(--font-hanzi)] text-lg font-semibold ${border}`} onClick={() => setPicked(option)}>
              {option}
            </button>
          );
        })}
      </div>
      {picked ? (
        <p className={`mt-4 text-base font-semibold ${talkAnswerMatches(picked, check.answer) ? "text-[#1F8A70]" : "text-[#9F1239]"}`} role="status" aria-live="polite">
          {talkAnswerMatches(picked, check.answer) ? t("lesson.correct") : t("lesson.wrong")} · {check.answer}
        </p>
      ) : null}
      {picked ? (
        <button
          type="button"
          className="btn-primary mt-auto"
          onClick={() => {
            setPicked(null);
            if (last) {
              passNode(hit.talk.id, "talk");
              setPhase("end");
            } else setStep(step + 1);
          }}
        >
          {last ? t("talk.done") : t("lesson.continue")}
        </button>
      ) : null}
      {leave}
    </main>
  );
}
