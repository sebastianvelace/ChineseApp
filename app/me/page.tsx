"use client";

import { levelFor, useT } from "@/lib/i18n";
import { useProgress, type Locale } from "@/lib/progress";

export default function MePage() {
  const { ready, xp, xpToday, streak, freezes, dailyGoal, setGoal, locale, setLocale, pinyin, setPinyin } = useProgress();
  const t = useT();
  if (!ready) return <p className="p-6">{t("loading")}</p>;
  const level = levelFor(xp, locale);
  return (
    <main className="px-5 py-6">
      <h1 className="text-3xl font-bold">{t("nav.me")}</h1>
      <p className="mt-4 text-lg font-semibold">{t("me.level", { level: level.level, title: level.title })}</p>
      <p className="mt-1 text-[#57534E]">🔥 {streak} · {xpToday} XP</p>
      <p className="text-sm text-[#57534E]">{t("streak.freezes", { count: freezes })}</p>
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
