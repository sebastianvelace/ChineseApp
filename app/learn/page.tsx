"use client";

import Link from "next/link";
import { trackById } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { unitState } from "@/lib/unlock";

export default function LearnPage() {
  const { ready, track, setTrack, streak, xpToday, dailyGoal, locale, passed } = useProgress();
  const t = useT();
  if (!ready) return <p className="p-6 text-[#57534E]">{t("loading")}</p>;
  const units = trackById(track)?.levels[0]?.units ?? [];
  return (
    <main className="px-5 py-6">
      <header className="flex items-baseline justify-between">
        <h1 className="font-[family-name:var(--font-hanzi)] text-3xl">汉路</h1>
        <p className="text-sm font-semibold text-[#57534E]">
          {streak > 0 ? `🔥 ${streak}` : ""} {xpToday}/{dailyGoal} XP
        </p>
      </header>
      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-[#57534E]">{t("local.banner")}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className={`min-h-11 rounded-full font-semibold ${track === "hsk" ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={() => setTrack("hsk")}>
          {t("track.hsk")}
        </button>
        <button className={`min-h-11 rounded-full font-semibold ${track === "everyday" ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={() => setTrack("everyday")}>
          {t("track.everyday")}
        </button>
      </div>
      <ol className="mt-8 flex flex-col items-center gap-4">
        {units.map((unit) => {
          const state = unitState(unit, passed);
          const locked = state === "locked";
          return (
            <li key={unit.id}>
              {locked ? (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E7E0D6] text-3xl grayscale" aria-label={t("unit.locked")}>
                  {unit.icon}
                </div>
              ) : (
                <Link
                  href={`/unit/${unit.id}`}
                  className="flex h-24 w-24 items-center justify-center rounded-full text-3xl text-white shadow-[0_8px_24px_rgb(28_25_23/6%)]"
                  style={{ background: unit.color, width: state === "current" ? 112 : 96, height: state === "current" ? 112 : 96 }}
                >
                  {state === "done" ? "✓" : unit.icon}
                </Link>
              )}
              <p className="mt-2 text-center text-sm font-semibold">{unit.title[locale]}</p>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
