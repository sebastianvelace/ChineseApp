"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

type Writer = {
  quiz: (opts: { onComplete?: () => void }) => void;
  cancelQuiz: () => void;
  animateCharacter: (opts?: { onComplete?: () => void }) => void;
};

function loadStrokeData(glyph: string, onLoad: (data: never) => void, onErr: (err?: unknown) => void) {
  fetch(`/strokes/${encodeURIComponent(glyph)}.json`)
    .then((res) => {
      if (res.ok) return res.json();
      return fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(glyph)}.json`).then((cdn) => {
        if (!cdn.ok) throw new Error("missing");
        return cdn.json();
      });
    })
            .then((data) => onLoad(data as never))
            .catch((err: unknown) => onErr(err));
}

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
          loadStrokeData(glyph, onLoad, onErr);
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
      <p className="mb-3 text-center font-[family-name:var(--font-hanzi)] text-[22px] font-medium text-[#1C1917]">{char}</p>
      <div ref={host} className="rounded-2xl bg-white" />
      {state === "loading" ? <p className="mt-3 text-base text-[#57534E]">{t("stroke.loading")}</p> : null}
      {state === "missing" ? <p className="mt-3 text-base text-[#57534E]">{t("stroke.missing")}</p> : null}
      {state === "ready" && !disabled ? (
        <button
          className="btn-ghost mt-4"
          onClick={() => {
            const pad = writer.current;
            pad?.cancelQuiz();
            let settled = false;
            const finish = () => {
              if (settled) return;
              settled = true;
              onResultRef.current(false);
            };
            pad?.animateCharacter({ onComplete: finish });
            window.setTimeout(finish, 5000);
          }}
        >
          {t("stroke.giveUp")}
        </button>
      ) : null}
      {state === "missing" && !disabled ? (
        <button className="btn-ghost mt-4" onClick={() => onResultRef.current(false)}>
          {t("stroke.giveUp")}
        </button>
      ) : null}
    </div>
  );
}

export function StrokeReplay({ char }: { char: string }) {
  const t = useT();
  const host = useRef<HTMLDivElement>(null);
  const writer = useRef<Writer | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let dead = false;
    (async () => {
      const mod = await import("hanzi-writer");
      if (dead || !host.current) return;
      host.current.innerHTML = "";
      const created = mod.default.create(host.current, char, {
        width: 220,
        height: 220,
        padding: 12,
        showOutline: true,
        showCharacter: true,
        charDataLoader: (glyph, onLoad, onErr) => {
          loadStrokeData(glyph, onLoad, onErr);
        },
      }) as Writer;
      if (dead) return;
      writer.current = created;
      setState("ready");
      created.animateCharacter();
    })().catch(() => {
      if (!dead) setState("missing");
    });
    return () => {
      dead = true;
    };
  }, [char]);

  if (state === "missing") return null;
  return (
    <figure className="flex flex-col items-center">
      <div ref={host} className="rounded-2xl bg-white" />
      {state === "ready" ? (
        <button type="button" className="mt-2 inline-flex min-h-11 items-center text-base font-semibold text-[#E25B45]" onClick={() => writer.current?.animateCharacter()}>
          {t("word.again")}
        </button>
      ) : (
        <p className="mt-2 text-sm text-[#57534E]">{t("stroke.loading")}</p>
      )}
    </figure>
  );
}
