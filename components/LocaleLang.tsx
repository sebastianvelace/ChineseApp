"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress";

export function LocaleLang() {
  const { locale } = useProgress();
  useEffect(() => {
    document.documentElement.lang = locale === "es" ? "es" : "en";
  }, [locale]);
  return null;
}
