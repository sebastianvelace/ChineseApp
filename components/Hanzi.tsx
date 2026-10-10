const CJK = /[\u3400-\u9fff]/;

export function HanziText({ children, size = "list" }: { children: React.ReactNode; size?: "card" | "list" }) {
  if (size === "card") {
    return <span className="font-[family-name:var(--font-hanzi)] text-[64px] font-medium leading-none">{children}</span>;
  }
  return <span className="font-[family-name:var(--font-hanzi)] text-[22px] font-medium">{children}</span>;
}

/** Keep Chinese runs in Noto Sans SC at list size. Latin stays in the surrounding font. */
export function withHanzi(text: string) {
  if (!CJK.test(text)) return text;
  return text.split(/([\u3400-\u9fff]+)/).filter(Boolean).map((part, index) =>
    CJK.test(part) ? <HanziText key={index}>{part}</HanziText> : <span key={index}>{part}</span>,
  );
}
