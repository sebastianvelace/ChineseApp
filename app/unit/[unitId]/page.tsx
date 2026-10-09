"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getLearnable, getUnit } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { extraStatus, lessonStatus } from "@/lib/unlock";

export default function UnitPage() {
  const params = useParams<{ unitId: string }>();
  const unit = getUnit(params.unitId);
  const { ready, locale, passed } = useProgress();
  const t = useT();
  if (!ready) return <p className="p-6">{t("loading")}</p>;
  if (!unit) return <p className="p-6">Missing unit.</p>;
  return (
    <main className="px-5 py-6" style={{ background: `${unit.color}14` }}>
      <Link href="/learn" className="text-sm font-semibold text-[#57534E]">‹</Link>
      <h1 className="mt-2 text-3xl font-bold">{unit.title[locale]}</h1>
      <ul className="mt-6 flex flex-col gap-3">
        {unit.lessons.map((lesson) => {
          const status = lessonStatus(unit, lesson, passed);
          const hanzi = [...lesson.targetWordIds, ...lesson.supportTargetIds].map((id) => getLearnable(id)?.hanzi).filter(Boolean).join("、");
          return <Row key={lesson.id} href={status === "locked" ? undefined : `/lesson/${lesson.id}`} title={t("unit.lesson", { order: lesson.order })} subtitle={hanzi} status={status} />;
        })}
      </ul>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-white/90" style={{ color: unit.color }}>{t("unit.further")}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        <Row href={extraStatus(unit, unit.teacherTalk.id, passed) === "locked" ? undefined : `/talk/${unit.teacherTalk.id}`} title={t("unit.talk")} subtitle={unit.teacherTalk.title[locale]} status={extraStatus(unit, unit.teacherTalk.id, passed)} />
        <Row href={extraStatus(unit, unit.review.id, passed) === "locked" ? undefined : `/lesson/${unit.review.id}`} title={t("unit.review")} subtitle={unit.review.title[locale]} status={extraStatus(unit, unit.review.id, passed)} />
      </ul>
    </main>
  );
}

function Row({ href, title, subtitle, status }: { href?: string; title: string; subtitle: string; status: string }) {
  const body = (
    <span className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4">
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block font-[family-name:var(--font-hanzi)] text-sm text-[#57534E]">{subtitle}</span>
      </span>
      <span className="text-[#57534E]">{status === "passed" ? "✓" : status === "locked" ? "🔒" : "›"}</span>
    </span>
  );
  if (!href) return <li>{body}</li>;
  return <li><Link href={href}>{body}</Link></li>;
}
