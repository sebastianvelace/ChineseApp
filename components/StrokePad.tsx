"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

type Writer = {
  quiz: (opts: { onComplete?: () => void }) => void;
  cancelQuiz: () => void;
  animateCharacter: () => void;
};

export function StrokePad({
  char,
  disabled,
  onResult,
}: {
  char: string;
  disabled: boolean;
  onResult: (ok: boolean) => void;
}) {
  const t = useT();
  const host = useRef<HTMLDivElement>(null);
  const writer = useRef<Writer | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let dead = false;
    setState("loading");
    (async () => {
      const mod = await import("hanzi-writer");
      const HanziWriter = mod.default;
      if (dead || !host.current) return;
      host.current.innerHTML = "";
      const created = HanziWriter.create(host.current, char, {
        width: 260,
        height: 260,
        padding: 12,
        showOutline: true,
        showCharacter: false,
        charDataLoader: (glyph, onLoad, onErr) => {
          fetch(`/strokes/${encodeURIComponent(glyph)}.json`)
            .then((res) => {
              if (res.ok) return res.json();
              return fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(glyph)}.json`).then((cdn) => {
                if (!cdn.ok) throw new Error("missing");
                return cdn.json();
              });
            })
            .then((data) => onLoad(data))
            .catch((err: Error) => onErr(err));
        },
      }) as Writer;
      if (dead) return;
      writer.current = created;
      setState("ready");
      created.quiz({
        onComplete: () => {
          if (!dead) onResultRef.current(true);
        },
      });
    })().catch(() => {
      if (!dead) setState("missing");
    });
    return () => {
      dead = true;
    };
  }, [char]);

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-center text-sm text-[#57534E]">{char}</p>
      <div ref={host} className="rounded-2xl bg-white" />
      {state === "loading" ? <p className="mt-3 text-sm text-[#57534E]">{t("stroke.loading")}</p> : null}
      {state === "missing" ? <p className="mt-3 text-sm text-[#57534E]">{t("stroke.missing")}</p> : null}
      {state === "ready" && !disabled ? (
        <button
          className="btn-ghost mt-4"
          onClick={() => {
            writer.current?.cancelQuiz();
            writer.current?.animateCharacter();
            onResultRef.current(false);
          }}
        >
          {t("stroke.giveUp")}
        </button>
      ) : null}
      {state === "missing" && !disabled ? (
        <button className="btn-primary mt-4" onClick={() => onResultRef.current(true)}>
          {t("lesson.continue")}
        </button>
      ) : null}
    </div>
  );
}
