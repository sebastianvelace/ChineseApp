"use client";

import { useEffect, useState } from "react";
import { useOnline } from "./online";
import { markOpened, openedLessons } from "./opened";

export function useSavedHere(id: string): "loading" | "saved" | "missing" {
  const online = useOnline();
  const [saved, setSaved] = useState<boolean | null>(null);
  useEffect(() => {
    const already = openedLessons().includes(id);
    setSaved(already);
    if (online) {
      markOpened(id);
      setSaved(true);
    }
  }, [online, id]);
  if (online === null || saved === null) return "loading";
  if (!online && !saved) return "missing";
  return "saved";
}

/** True when the phone can open this lesson or talk. Event handlers only. */
export function canOpenOffline(id: string): boolean {
  return navigator.onLine || openedLessons().includes(id);
}
