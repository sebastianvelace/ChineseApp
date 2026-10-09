"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded || sessionStorage.getItem("hanlu-sw") === "ready") return;
      reloaded = true;
      sessionStorage.setItem("hanlu-sw", "ready");
      window.location.reload();
    });
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
