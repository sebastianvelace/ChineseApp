const PAGES = ["/learn", "/practice", "/practice/session", "/me"];

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

/** Cache the learning tabs and the page on screen so they reopen offline. */
export async function warmAppShell(current: string): Promise<void> {
  const path = current.split("?")[0] || "/";
  const pages = [...new Set([path, ...PAGES])];
  await Promise.all(pages.map(warmPage));
}
