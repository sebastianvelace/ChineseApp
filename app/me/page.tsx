"use client";

import { ChevronRight, Flame } from "lucide-react";
import { useState } from "react";
import { LoadingRows } from "@/components/LoadingRows";
import { Sheet } from "@/components/Sheet";
import { levelFor, useT } from "@/lib/i18n";
import { useProgress, type Locale } from "@/lib/progress";

type SheetId = "goal" | "language" | "pinyin" | "account";

export default function MePage() {
  const { ready, xp, xpToday, streak, freezes, dailyGoal, setGoal, locale, setLocale, pinyin, setPinyin, seen, activeDays, weekDates } = useProgress();
  const t = useT();
  const [open, setOpen] = useState<SheetId | null>(null);
  if (!ready) return <LoadingRows />;
  const level = levelFor(xp, locale);
  const languageName = locale === "es" ? "Español" : "English";
  const pinyinName = pinyin ? t("onboarding.shown") : t("onboarding.hidden");

  return (
    <main className="px-5 py-6">
      <h1 className="text-3xl font-bold">{t("nav.me")}</h1>
      <p className="mt-4 text-lg font-semibold">{t("me.level", { level: level.level, title: level.title })}</p>
      <p className="mt-1 inline-flex items-center gap-1 text-[#57534E]">
        <Flame size={16} className="text-[#E25B45]" aria-hidden /> {streak} · {xpToday} XP · {t("me.words", { count: seen.size })}
      </p>
      <p className="text-sm text-[#57534E]">{t("streak.freezes", { count: freezes })}</p>
      <ol className="mt-4 flex justify-between gap-1">
        {weekDates.map((date) => {
          const [year, month, day] = date.split("-").map(Number);
          const label = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).toLocaleDateString(locale === "es" ? "es" : "en", { weekday: "narrow" });
          const on = activeDays.includes(date);
          return (
            <li key={date} className="flex flex-1 flex-col items-center gap-1 text-xs text-[#57534E]">
              <span>{label}</span>
              <span className={`h-8 w-8 rounded-full ${on ? "bg-[#E25B45]" : "bg-[#E7E0D6]"}`} />
            </li>
          );
        })}
      </ol>
      <div className="mt-6">
        <Row label={t("me.goal")} value={t("lesson.xp", { count: dailyGoal })} onClick={() => setOpen("goal")} />
        <Row label={t("me.language")} value={languageName} onClick={() => setOpen("language")} />
        <Row label={t("me.pinyin")} value={pinyinName} onClick={() => setOpen("pinyin")} />
        <Row label={t("me.account")} value={t("me.guest")} onClick={() => setOpen("account")} />
      </div>
      {open === "goal" ? (
        <Sheet title={t("me.goal")} closeLabel={t("sheet.close")} onClose={() => setOpen(null)}>
          <div className="grid grid-cols-3 gap-2">
            {([10, 20, 50] as const).map((goal) => (
              <Choice key={goal} pressed={dailyGoal === goal} onClick={() => setGoal(goal)}>
                {goal}
              </Choice>
            ))}
          </div>
        </Sheet>
      ) : null}
      {open === "language" ? (
        <Sheet title={t("me.language")} closeLabel={t("sheet.close")} onClose={() => setOpen(null)}>
          <div className="grid grid-cols-2 gap-2">
            <Choice pressed={locale === "en"} onClick={() => setLocale("en" as Locale)}>
              English
            </Choice>
            <Choice pressed={locale === "es"} onClick={() => setLocale("es" as Locale)}>
              Español
            </Choice>
          </div>
        </Sheet>
      ) : null}
      {open === "pinyin" ? (
        <Sheet title={t("me.pinyin")} closeLabel={t("sheet.close")} onClose={() => setOpen(null)}>
          <div className="grid grid-cols-2 gap-2">
            <Choice pressed={pinyin} onClick={() => setPinyin(true)}>
              {t("onboarding.shown")}
            </Choice>
            <Choice pressed={!pinyin} onClick={() => setPinyin(false)}>
              {t("onboarding.hidden")}
            </Choice>
          </div>
        </Sheet>
      ) : null}
      {open === "account" ? (
        <Sheet title={t("me.account")} closeLabel={t("sheet.close")} onClose={() => setOpen(null)}>
          <p className="text-base text-[#57534E]">{t("local.banner")}</p>
        </Sheet>
      ) : null}
    </main>
  );
}

function Row({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" className="flex min-h-14 w-full items-center justify-between border-b border-[#E7E0D6] text-left" onClick={onClick}>
      <span className="font-semibold">{label}</span>
      <span className="inline-flex items-center gap-1 text-[#57534E]">
        {value}
        <ChevronRight size={18} aria-hidden />
      </span>
    </button>
  );
}

function Choice({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={pressed} className={`min-h-12 rounded-xl font-semibold ${pressed ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={onClick}>
      {children}
    </button>
  );
}
