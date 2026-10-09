"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useProgress, type Locale } from "@/lib/progress";

export default function Onboarding() {
  const t = useT();
  const { completeOnboarding, locale, onboarded, ready } = useProgress();
  const router = useRouter();
  const [language, setLanguage] = useState<Locale>(locale);
  const [pinyin, setPinyin] = useState(true);
  useEffect(() => {
    if (ready && onboarded) router.replace("/learn");
  }, [ready, onboarded, router]);

  return (
    <main className="flex min-h-full flex-col px-6 py-16">
      <p className="font-[family-name:var(--font-hanzi)] text-5xl">汉路</p>
      <p className="mt-3 text-lg">{language === "es" ? "Aprende chino, paso a paso." : "Learn Chinese, one step at a time."}</p>
      <p className="mt-10 text-sm font-semibold text-[#57534E]">{t("onboarding.language")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Pick on={language === "en"} onClick={() => setLanguage("en")} label="English" />
        <Pick on={language === "es"} onClick={() => setLanguage("es")} label="Español" />
      </div>
      <p className="mt-8 text-sm font-semibold text-[#57534E]">{t("onboarding.pinyin")}</p>
      <p className="mt-1 text-lg text-[#57534E]">nǐ hǎo</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Pick on={pinyin} onClick={() => setPinyin(true)} label={t("onboarding.shown")} />
        <Pick on={!pinyin} onClick={() => setPinyin(false)} label={t("onboarding.hidden")} />
      </div>
      <button
        className="btn-primary mt-auto"
        onClick={() => completeOnboarding(language, pinyin)}
      >
        {language === "es" ? "Empezar" : "Start"}
      </button>
    </main>
  );
}

function Pick({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`min-h-12 rounded-xl border font-semibold ${on ? "border-[#1C1917] bg-white" : "border-[#E7E0D6] bg-white/60"}`} onClick={onClick}>
      {label}
    </button>
  );
}
