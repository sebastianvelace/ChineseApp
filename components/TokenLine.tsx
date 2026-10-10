"use client";

import { useState } from "react";
import { getLearnable } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import type { Token } from "@/lib/types";

export function TokenLine({ tokens }: { tokens: Token[] }) {
  const { locale, pinyin } = useProgress();
  const [open, setOpen] = useState<number | null>(null);
  const token = open === null ? undefined : tokens[open];
  const itemId = token?.wordId ?? token?.supportId;
  const item = itemId ? getLearnable(itemId) : undefined;

  return (
    <div>
      <div className="font-[family-name:var(--font-hanzi)] text-xl leading-9">
        {tokens.map((part, index) =>
          part.kind === "punct" ? (
            <span key={index}>{part.text}</span>
          ) : (
            <button
              key={index}
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center underline decoration-[#E7E0D6] underline-offset-4"
              onClick={() => setOpen(open === index ? null : index)}
            >
              {part.text}
            </button>
          ),
        )}
      </div>
      {item ? (
        <p className="mt-2 rounded-xl bg-[#F7F3EC] px-3 py-2 text-sm text-[#57534E]">
          <span className="font-[family-name:var(--font-hanzi)] text-base text-[#1C1917]">{item.hanzi}</span>
          {pinyin ? ` ${item.pinyin}` : ""} · {item.gloss[locale]}
        </p>
      ) : null}
    </div>
  );
}
