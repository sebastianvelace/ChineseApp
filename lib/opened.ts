const KEY = "hanlu-opened-v1";

export function openedLessons(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markOpened(id: string) {
  const ids = new Set(openedLessons());
  ids.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // Private mode can refuse the write. The lesson still plays while online.
  }
}
