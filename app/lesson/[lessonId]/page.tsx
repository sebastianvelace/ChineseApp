"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Player } from "@/components/Player";
import { OfflineLesson } from "@/components/OfflineLesson";
import { assembleLesson, assembleReview, lessonTargets, unitTargets } from "@/lib/assemble";
import { allUnits, findLesson, findReview, getLearnable } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { canOpenOffline, useSavedHere } from "@/lib/saved-here";
import { assignIfOffline } from "@/lib/warm-shell";
import { extraStatus, lessonStatus, nextLessonStep } from "@/lib/unlock";

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const t = useT();
  const { ready, seen, passed, passNode } = useProgress();
  const saved = useSavedHere(params.lessonId);
  const [blocked, setBlocked] = useState(false);
  const [replayState, setReplayState] = useState<{ id: string; value: boolean } | null>(null);
  function go(href: string) {
    const guarded = href.startsWith("/lesson/") || href.startsWith("/talk/");
    const id = href.split("/").filter(Boolean).pop() ?? "";
    if (guarded && !canOpenOffline(id)) {
      setBlocked(true);
      return;
    }
    if (assignIfOffline(href)) return;
    router.push(href);
  }
  if (!ready || saved === "loading") return <p className="p-6">{t("loading")}</p>;
  if (saved === "missing") return <OfflineLesson />;
  if (blocked) return <OfflineLesson onBack={() => setBlocked(false)} />;

  const lessonHit = findLesson(params.lessonId);
  const reviewHit = findReview(params.lessonId);
  if (!lessonHit && !reviewHit) return <p className="p-6 text-base">{t("missing.lesson")}</p>;

  if (lessonHit) {
    const status = lessonStatus(lessonHit.unit, lessonHit.lesson, passed);
    if (status === "locked") return <Locked back={`/unit/${lessonHit.unit.id}`} />;
    const items = assembleLesson(lessonHit.lesson.id, [...seen]);
    const replay = replayState?.id === lessonHit.lesson.id ? replayState.value : !!passed[lessonHit.lesson.id];
    return (
      <Player
        key={lessonHit.lesson.id}
        title={t("unit.lesson", { order: lessonHit.lesson.order })}
        items={items}
        grammar={lessonHit.lesson.grammar}
        xpFor={(correct) => (replay ? 5 : 20 + 2 * correct)}
        onPass={(result) => {
          setReplayState({ id: lessonHit.lesson.id, value: replay });
          passNode(lessonHit.lesson.id, "lesson", { ...result, itemIds: lessonTargets(lessonHit.lesson) });
        }}
        onExit={() => go(`/unit/${lessonHit.unit.id}`)}
        onNext={() => {
          const step = nextLessonStep(lessonHit.unit, lessonHit.lesson.id, passed);
          if (step) go(step.href);
        }}
        nextLabel={nextLessonStep(lessonHit.unit, lessonHit.lesson.id, passed)?.kind === "talk" ? t("unit.talk") : t("lesson.next")}
        learned={lessonTargets(lessonHit.lesson).map((id) => getLearnable(id)?.hanzi).filter((hanzi): hanzi is string => !!hanzi)}
        accent={lessonHit.unit.color}
      />
    );
  }

  const status = extraStatus(reviewHit!.unit, reviewHit!.review.id, passed);
  if (status === "locked") return <Locked back={`/unit/${reviewHit!.unit.id}`} />;
  const replay = replayState?.id === reviewHit!.review.id ? replayState.value : !!passed[reviewHit!.review.id];
  return (
    <Player
      key={reviewHit!.review.id}
      title={t("unit.review")}
      items={assembleReview(reviewHit!.unit, reviewHit!.review)}
      xpFor={() => (replay ? 0 : 15)}
      onPass={(result) => {
        setReplayState({ id: reviewHit!.review.id, value: replay });
        passNode(reviewHit!.review.id, "review", { ...result, itemIds: unitTargets(reviewHit!.unit) });
      }}
      onExit={() => go(`/unit/${reviewHit!.unit.id}`)}
      onNext={nextUnitHref(reviewHit!.unit.id) ? () => go(nextUnitHref(reviewHit!.unit.id)!) : undefined}
      nextLabel={t("lesson.nextUnit")}
      accent={reviewHit!.unit.color}
    />
  );
}

function nextUnitHref(unitId: string): string | null {
  const next = allUnits().find((unit) => unit.requiresUnitId === unitId);
  return next ? `/unit/${next.id}` : null;
}

function Locked({ back }: { back: string }) {
  const t = useT();
  return (
    <main className="px-6 py-16">
      <h1 className="text-2xl font-bold">{t("unit.locked")}</h1>
      <p className="mt-2 text-[#57534E]">{t("locked.body")}</p>
      <Link href={back} className="btn-primary mt-8 inline-flex items-center justify-center">{t("lesson.back")}</Link>
    </main>
  );
}
