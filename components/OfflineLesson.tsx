"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

export function OfflineLesson({ onBack }: { onBack?: () => void }) {
  const t = useT();
  const router = useRouter();
  return (
    <main className="px-6 py-16">
      <h1 className="font-[family-name:var(--font-hanzi)] text-3xl">汉路</h1>
      <p className="mt-3 text-[#57534E]">{t("offline.lesson")}</p>
      <button className="btn-primary mt-8" onClick={() => (onBack ? onBack() : router.push("/learn"))}>
        {t("lesson.back")}
      </button>
    </main>
  );
}
