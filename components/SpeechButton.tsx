"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

export function SpeechButton({ text }: { text: string }) {
  const t = useT();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function speak() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window) || !text) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.82;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      className="audio-button"
      aria-label={t(speaking ? "audio.stop" : "audio.play")}
      title={t(speaking ? "audio.stop" : "audio.play")}
      onClick={speak}
    >
      {speaking ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
    </button>
  );
}
