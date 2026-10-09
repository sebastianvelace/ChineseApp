"use client";

import { Check, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LoadingRows } from "@/components/LoadingRows";
import { OfflineLesson } from "@/components/OfflineLesson";
import { getLearnable, getUnit } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { canOpenOffline } from "@/lib/saved-here";
import { extraStatus, lessonStatus } from "@/lib/unlock";

export default function UnitPage() {
  const params = useParams<{ unitId: string }>();
  const unit = getUnit(params.unitId);
  const { ready, locale, passed } = useProgress();
  const t = useT();
  const [blocked, setBlocked] = useState(false);
  function guard(event: { preventDefault: () => void }, id: string) {
    if (canOpenOffline(id)) return;
    event.preventDefault();
    setBlocked(true);
  }
  if (!ready) return <LoadingRows />;
  if (!unit) return <p className="p-6">Missing unit.</p>;
  if (blocked) return <OfflineLesson onBack={() => setBlocked(false)} />;
  return (
    <main className="px-5 py-6" style={{ background: `${unit.color}14` }}>
      <Link href="/learn" className="text-sm font-semibold text-[#57534E]">‹</Link>
      <h1 className="mt-2 text-3xl font-bold">{unit.title[locale]}</h1>
      <ul className="mt-6 flex flex-col gap-3">
        {unit.lessons.map((lesson) => {
          const status = lessonStatus(unit, lesson, passed);
          const hanzi = [...lesson.targetWordIds, ...lesson.supportTargetIds].map((id) => getLearnable(id)?.hanzi).filter(Boolean).join("、");
          return <Row key={lesson.id} href={status === "locked" ? undefined : `/lesson/${lesson.id}`} title={t("unit.lesson", { order: lesson.order })} subtitle={lesson.grammar.pattern} detail={hanzi} status={status} onNavigate={(event) => guard(event, lesson.id)} />;
        })}
      </ul>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-white/90" style={{ color: unit.color }}>{t("unit.further")}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        <Row href={extraStatus(unit, unit.teacherTalk.id, passed) === "locked" ? undefined : `/talk/${unit.teacherTalk.id}`} title={t("unit.talk")} subtitle={unit.teacherTalk.title[locale]} status={extraStatus(unit, unit.teacherTalk.id, passed)} onNavigate={(event) => guard(event, unit.teacherTalk.id)} />
        <Row href={extraStatus(unit, unit.review.id, passed) === "locked" ? undefined : `/lesson/${unit.review.id}`} title={t("unit.review")} subtitle={unit.review.title[locale]} status={extraStatus(unit, unit.review.id, passed)} onNavigate={(event) => guard(event, unit.review.id)} />
      </ul>
    </main>
  );
}

function Row({ href, title, subtitle, detail, status, onNavigate }: { href?: string; title: string; subtitle: string; detail?: string; status: string; onNavigate?: (event: { preventDefault: () => void }) => void }) {
  const body = (
    <span className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4">
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-[#57534E]">{subtitle}</span>
        {detail ? <span className="mt-1 block font-[family-name:var(--font-hanzi)] text-sm">{detail}</span> : null}
      </span>
      <span className="text-[#57534E]">{status === "passed" ? <Check size={20} aria-hidden /> : status === "locked" ? <Lock size={20} aria-hidden /> : <ChevronRight size={20} aria-hidden />}</span>
    </span>
  );
  if (!href) return <li>{body}</li>;
  return <li><Link href={href} onClick={onNavigate}>{body}</Link></li>;
}
