"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";

export default function Home() {
  const { ready, onboarded } = useProgress();
  const router = useRouter();
  const t = useT();
  useEffect(() => {
    if (!ready) return;
    router.replace(onboarded ? "/learn" : "/onboarding");
  }, [ready, onboarded, router]);
  return <p className="p-6 text-[#57534E]">{t("loading")}</p>;
}
