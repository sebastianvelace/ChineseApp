"use client";

import { Check, Flame, X } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { LoadingRows } from "@/components/LoadingRows";
import { OfflineLesson } from "@/components/OfflineLesson";
import { trackById } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { canOpenOffline } from "@/lib/saved-here";
import { openOffline } from "@/lib/warm-shell";
import { resumeTarget, unitState } from "@/lib/unlock";

export default function LearnPage() {
  const { ready, track, setTrack, streak, xpToday, dailyGoal, locale, passed, freezeNotice, dismissFreezeNotice } = useProgress();
  const t = useT();
  const [blocked, setBlocked] = useState(false);
  const banner = useSyncExternalStore(subscribeBanner, getBannerSnapshot, getBannerServerSnapshot);
  if (!ready) return <LoadingRows />;
  if (blocked) return <OfflineLesson onBack={() => setBlocked(false)} />;
  const units = trackById(track)?.levels[0]?.units ?? [];
  return (
    <main className="px-5 py-6">
      <header className="flex items-baseline justify-between">
        <h1 className="font-[family-name:var(--font-hanzi)] text-3xl">汉路</h1>
        <p className="text-sm font-semibold text-[#57534E]">
          {streak > 0 ? <span className="inline-flex items-center gap-1"><Flame size={16} className="text-[#E25B45]" aria-hidden /> {streak}</span> : null} {xpToday}/{dailyGoal} XP
        </p>
      </header>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E7E0D6]">
        <div className="h-full rounded-full bg-[#E25B45]" style={{ width: `${Math.min(100, dailyGoal ? (xpToday / dailyGoal) * 100 : 0)}%` }} />
      </div>
      {freezeNotice ? (
        <button className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold" onClick={dismissFreezeNotice}>
          {t("streak.freezeUsed")}
        </button>
      ) : null}
      {banner ? (
        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-[#57534E]">
          <p className="flex-1">{t("local.banner")}</p>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            aria-label={t("sheet.close")}
            onClick={() => {
              sessionStorage.setItem("hanlu-local-banner", "off");
              window.dispatchEvent(new Event("hanlu-local-banner"));
            }}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className={`min-h-11 rounded-full font-semibold ${track === "hsk" ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={() => setTrack("hsk")}>
          {t("track.hsk")}
        </button>
        <button className={`min-h-11 rounded-full font-semibold ${track === "everyday" ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={() => setTrack("everyday")}>
          {t("track.everyday")}
        </button>
      </div>
      {(() => {
        const next = resumeTarget(units, passed);
        if (!next) return null;
        const label = next.kind === "lesson" ? t("unit.lesson", { order: next.order ?? 1 }) : next.kind === "talk" ? t("unit.talk") : t("unit.review");
        return (
          <Link
            href={next.href}
            className="mt-4 block rounded-2xl bg-[#E25B45] px-4 py-4 text-white"
            onClick={(event) => {
              const id = next.href.split("/").filter(Boolean).pop() ?? "";
              if (!canOpenOffline(id)) {
                event.preventDefault();
                setBlocked(true);
                return;
              }
              openOffline(event, next.href);
            }}
          >
            <span className="text-sm font-semibold">{t("practice.continue")}</span>
            <span className="mt-1 block text-lg font-bold">{label}</span>
            {next.hanzi ? <span className="mt-1 block font-[family-name:var(--font-hanzi)] text-[22px] font-medium">{next.hanzi}</span> : null}
          </Link>
        );
      })()}
      <ol className="mx-auto mt-8 flex w-full max-w-xs flex-col items-center">
        {units.map((unit, index) => {
          const state = unitState(unit, passed);
          const locked = state === "locked";
          const done = unit.lessons.filter((lesson) => passed[lesson.id]).length;
          const size = state === "current" ? 96 : 80;
          const node = (
            <span
              className="flex items-center justify-center rounded-full text-3xl shadow-[0_8px_24px_rgb(28_25_23/6%)]"
              style={{
                width: size,
                height: size,
                background: locked ? "#E7E0D6" : unit.color,
                color: locked ? "#57534E" : "#fff",
                outline: state === "current" ? "4px solid #fff" : undefined,
                boxShadow: state === "current" ? `0 0 0 6px ${unit.color}` : undefined,
              }}
            >
              {state === "done" ? <Check size={32} aria-hidden /> : unit.icon}
            </span>
          );
          return (
            <li key={unit.id} className="flex w-full flex-col items-center">
              {index > 0 ? <span className="my-1 h-8 w-px bg-[#D6D3D1]" /> : null}
              {locked ? <div aria-label={t("unit.locked")}>{node}</div> : <Link href={`/unit/${unit.id}`} onClick={(event) => openOffline(event, `/unit/${unit.id}`)}>{node}</Link>}
              <p className="mt-2 text-center text-sm font-semibold">{unit.title[locale]}</p>
              <p className="text-center text-xs text-[#57534E]">
                {state === "done" ? t("unit.done") : state === "locked" ? t("unit.locked") : t("unit.progress", { done, total: unit.lessons.length })}
              </p>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

function subscribeBanner(onChange: () => void) {
  window.addEventListener("hanlu-local-banner", onChange);
  return () => window.removeEventListener("hanlu-local-banner", onChange);
}

function getBannerSnapshot() {
  return sessionStorage.getItem("hanlu-local-banner") !== "off";
}

function getBannerServerSnapshot() {
  return true;
}
