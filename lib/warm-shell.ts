import { allUnits } from "./content";

const PAGES = ["/learn", "/practice", "/practice/session", "/me"];

export function shellPages(): string[] {
  return [...PAGES, ...allUnits().map((unit) => `/unit/${unit.id}`)];
}

/** Offline taps load the saved document instead of a client navigation that the cache skips. */
export function openOffline(event: { preventDefault: () => void; defaultPrevented?: boolean }, href: string): void {
  if (typeof navigator === "undefined" || navigator.onLine || event.defaultPrevented) return;
  event.preventDefault();
  window.location.assign(href);
}

export function staticAssetUrls(html: string): string[] {
  return [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((match) => match[1].replaceAll("&amp;", "&"));
}

async function warmPage(path: string): Promise<void> {
  try {
    const response = await fetch(path, { credentials: "same-origin" });
    if (!response.ok) return;
    const html = await response.text();
    await Promise.all(staticAssetUrls(html).map((url) => fetch(url).catch(() => undefined)));
  } catch {
    // A failed warm leaves the page usable online.
  }
}

let warmedCatalog = false;

/** Cache the learning tabs, units, and the page on screen so they reopen offline. */
export async function warmAppShell(current: string): Promise<void> {
  const path = current.split("?")[0] || "/";
  const pages = warmedCatalog ? [path] : [...new Set([path, ...shellPages()])];
  warmedCatalog = true;
  await Promise.all(pages.map(warmPage));
}
