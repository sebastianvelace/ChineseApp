"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Sheet({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#1C1917]/40 lg:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="w-full max-w-[480px] rounded-t-3xl bg-[#F7F3EC] px-5 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-xl lg:rounded-3xl lg:pb-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="sheet-title" className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-[#57534E]" aria-label={closeLabel} onClick={onClose}>
            <X size={22} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
