"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useOnline } from "@/lib/online";
import { useProgress } from "@/lib/progress";

const HIDE = [/^\/lesson\//, /^\/talk\//, /^\/onboarding$/, /^\/practice\/session/];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { ready, onboarded } = useProgress();
  const online = useOnline();
  const t = useT();
  useEffect(() => {
    if (!ready) return;
    if (!onboarded && path !== "/onboarding" && path !== "/") router.replace("/onboarding");
  }, [ready, onboarded, path, router]);
  const hide = HIDE.some((re) => re.test(path));
  const wide = path === "/learn" || path === "/practice" || path === "/me" || path.startsWith("/unit") || path.startsWith("/word");
  return (
    <div className="min-h-full bg-[#F7F3EC] text-[#1C1917]">
      <div className={wide && !hide ? "mx-auto min-h-full w-full max-w-[480px] pb-24 lg:max-w-none lg:pl-56" : "mx-auto min-h-full w-full max-w-[480px]"}>
        {online === false && !hide ? <p className="px-5 pt-4 text-sm font-semibold text-[#57534E]">{t("offline.banner")}</p> : null}
        {children}
      </div>
      {hide ? null : (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E7E0D6] bg-white pb-[env(safe-area-inset-bottom)] lg:inset-y-0 lg:right-auto lg:w-56 lg:border-r lg:border-t-0 lg:pb-0">
          <div className="mx-auto flex max-w-[480px] lg:max-w-none lg:flex-col lg:gap-2 lg:p-4">
            <NavLink href="/learn" label={t("nav.learn")} active={path.startsWith("/learn") || path.startsWith("/unit")} />
            <NavLink href="/practice" label={t("nav.practice")} active={path.startsWith("/practice") || path.startsWith("/word")} />
            <NavLink href="/me" label={t("nav.me")} active={path.startsWith("/me")} />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`flex min-h-16 flex-1 items-center justify-center text-sm font-semibold ${active ? "text-[#E25B45]" : "text-[#57534E]"}`}>
      {label}
    </Link>
  );
}
