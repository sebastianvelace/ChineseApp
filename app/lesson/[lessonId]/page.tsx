"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { assembleLesson, assembleReview, lessonTargets, unitTargets } from "@/lib/assemble";
import { findLesson, findReview } from "@/lib/content";
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
    />
  );
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
