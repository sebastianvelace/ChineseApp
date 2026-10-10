"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { assignIfOffline } from "@/lib/warm-shell";

export function OfflineLesson({ onBack }: { onBack?: () => void }) {
  const t = useT();
  const router = useRouter();
  return (
    <main className="px-6 py-16">
      <h1 className="font-[family-name:var(--font-hanzi)] text-3xl">汉路</h1>
      <p className="mt-3 text-[#57534E]">{t("offline.lesson")}</p>
      <button className="btn-primary mt-8" onClick={() => {
        if (onBack) {
          onBack();
          return;
        }
        if (assignIfOffline("/learn")) return;
        router.push("/learn");
      }}>
        {t("lesson.back")}
      </button>
    </main>
  );
}
