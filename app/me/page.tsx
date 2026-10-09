"use client";

import { levelFor, useT } from "@/lib/i18n";
import { useProgress, type Locale } from "@/lib/progress";

export default function MePage() {
  const { ready, xp, xpToday, streak, freezes, dailyGoal, setGoal, locale, setLocale, pinyin, setPinyin, seen, activeDays, weekDates } = useProgress();
  const t = useT();
  if (!ready) return <p className="p-6">{t("loading")}</p>;
  const level = levelFor(xp, locale);
  return (
    <main className="px-5 py-6">
      <h1 className="text-3xl font-bold">{t("nav.me")}</h1>
      <p className="mt-4 text-lg font-semibold">{t("me.level", { level: level.level, title: level.title })}</p>
      <p className="mt-1 text-[#57534E]">🔥 {streak} · {xpToday} XP · {t("me.words", { count: seen.size })}</p>
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
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-[#57534E]">{t("me.goal")}</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[10, 20, 50].map((goal) => (
            <button key={goal} className={`min-h-12 rounded-xl font-semibold ${dailyGoal === goal ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={() => setGoal(goal as 10 | 20 | 50)}>
              {goal}
            </button>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-[#57534E]">{t("me.language")}</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className={`min-h-12 rounded-xl font-semibold ${locale === "en" ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={() => setLocale("en" as Locale)}>English</button>
          <button className={`min-h-12 rounded-xl font-semibold ${locale === "es" ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={() => setLocale("es" as Locale)}>Español</button>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-[#57534E]">{t("me.pinyin")}</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className={`min-h-12 rounded-xl font-semibold ${pinyin ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={() => setPinyin(true)}>{t("onboarding.shown")}</button>
          <button className={`min-h-12 rounded-xl font-semibold ${!pinyin ? "bg-[#1C1917] text-white" : "bg-white"}`} onClick={() => setPinyin(false)}>{t("onboarding.hidden")}</button>
        </div>
      </section>
      <p className="mt-8 text-sm text-[#57534E]">{t("me.account")}</p>
    </main>
  );
}
