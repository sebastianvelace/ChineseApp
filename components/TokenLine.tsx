"use client";

import { useState } from "react";
import { getLearnable } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import type { Token } from "@/lib/types";

export function TokenLine({
  tokens,
  size = "inline",
  blankAt,
  blankRevealed = false,
}: {
  tokens: Token[];
  size?: "inline" | "card" | "sentence";
  blankAt?: number;
  blankRevealed?: boolean;
}) {
  const { locale, pinyin } = useProgress();
  const [open, setOpen] = useState<number | null>(null);
  const token = open === null ? undefined : tokens[open];
  const itemId = token?.wordId ?? token?.supportId;
  const item = itemId ? getLearnable(itemId) : undefined;
  const type = size === "card" ? "text-[64px] font-medium leading-tight" : size === "sentence" ? "text-2xl leading-9" : "text-xl leading-9";
  let contentIndex = -1;

  return (
    <div>
      <div className={`font-[family-name:var(--font-hanzi)] ${type}`}>
        {tokens.map((part, index) => {
          if (part.kind === "punct") return <span key={index}>{part.text}</span>;
          contentIndex += 1;
          if (contentIndex === blankAt && !blankRevealed) return <span key={index}>____</span>;
          const revealed = contentIndex === blankAt && blankRevealed;
          return (
            <button
              key={index}
              type="button"
              className={`inline-flex min-h-11 min-w-11 items-center justify-center underline decoration-[#E7E0D6] underline-offset-4 ${revealed ? "text-[#1F8A70]" : ""}`}
              onClick={() => setOpen(open === index ? null : index)}
            >
              {part.text}
            </button>
          );
        })}
      </div>
      {item ? (
        <p className="mt-2 rounded-xl bg-[#F7F3EC] px-3 py-2 text-base text-[#57534E]">
          <span className="font-[family-name:var(--font-hanzi)] text-base text-[#1C1917]">{item.hanzi}</span>
          {pinyin ? <span className="text-lg"> {item.pinyin}</span> : null} · {item.gloss[locale]}
        </p>
      ) : null}
    </div>
  );
}
