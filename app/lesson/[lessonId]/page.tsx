"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { assembleLesson, assembleReview, lessonTargets, unitTargets } from "@/lib/assemble";
import { allUnits, findLesson, findReview } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { extraStatus, lessonStatus } from "@/lib/unlock";
import { Player } from "@/components/Player";

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const t = useT();
  const { ready, seen, passed, passNode } = useProgress();
  if (!ready) return <p className="p-6">{t("loading")}</p>;

  const lessonHit = findLesson(params.lessonId);
  const reviewHit = findReview(params.lessonId);
  if (!lessonHit && !reviewHit) return <p className="p-6">Missing lesson.</p>;

  if (lessonHit) {
    const status = lessonStatus(lessonHit.unit, lessonHit.lesson, passed);
    if (status === "locked") return <Locked back={`/unit/${lessonHit.unit.id}`} />;
    const items = assembleLesson(lessonHit.lesson, seen);
    return (
      <Player
        key={lessonHit.lesson.id}
        title={t("unit.lesson", { order: lessonHit.lesson.order })}
        items={items}
        grammar={lessonHit.lesson.grammar}
        xpFor={(correct) => (passed[lessonHit.lesson.id] ? 5 : 20 + 2 * correct)}
        onPass={(result) => passNode(lessonHit.lesson.id, "lesson", { ...result, itemIds: lessonTargets(lessonHit.lesson) })}
        onExit={() => router.push(`/unit/${lessonHit.unit.id}`)}
        onNext={() => router.push(nextAfterLesson(lessonHit.unit, lessonHit.lesson.order))}
        nextLabel={lessonHit.unit.lessons.some((lesson) => lesson.order === lessonHit.lesson.order + 1) ? t("lesson.next") : t("unit.talk")}
      />
    );
  }

  const status = extraStatus(reviewHit!.unit, reviewHit!.review.id, passed);
  if (status === "locked") return <Locked back={`/unit/${reviewHit!.unit.id}`} />;
  return (
    <Player
      key={reviewHit!.review.id}
      title={t("unit.review")}
      items={assembleReview(reviewHit!.unit, reviewHit!.review)}
      xpFor={() => 15}
      onPass={(result) => passNode(reviewHit!.review.id, "review", { ...result, itemIds: unitTargets(reviewHit!.unit) })}
      onExit={() => router.push(`/unit/${reviewHit!.unit.id}`)}
      onNext={nextUnitHref(reviewHit!.unit.id) ? () => router.push(nextUnitHref(reviewHit!.unit.id)!) : undefined}
      nextLabel={t("lesson.nextUnit")}
    />
  );
}

function nextAfterLesson(unit: { id: string; lessons: { id: string; order: number }[]; teacherTalk: { id: string } }, order: number): string {
  const following = unit.lessons.find((lesson) => lesson.order === order + 1);
  return following ? `/lesson/${following.id}` : `/talk/${unit.teacherTalk.id}`;
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
