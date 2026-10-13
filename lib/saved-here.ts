"use client";

import { useEffect } from "react";
import { useOnline } from "./online";
import { markOpened, openedLessons } from "./opened";

export function useSavedHere(id: string): "loading" | "saved" | "missing" {
  const online = useOnline();
  useEffect(() => {
    if (online) {
      markOpened(id);
    }
  }, [online, id]);
  if (online === null) return "loading";
  if (!online && !openedLessons().includes(id)) return "missing";
  return "saved";
}

/** True when the phone can open this lesson or talk. Event handlers only. */
export function canOpenOffline(id: string): boolean {
  return navigator.onLine || openedLessons().includes(id);
}
