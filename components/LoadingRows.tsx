"use client";

import { useT } from "@/lib/i18n";

export function LoadingRows() {
  const t = useT();
  return (
    <main className="px-5 py-6" aria-busy="true">
      <p className="sr-only">{t("loading")}</p>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-16 animate-pulse rounded-2xl bg-[#E7E0D6]" />
        ))}
      </div>
    </main>
  );
}
