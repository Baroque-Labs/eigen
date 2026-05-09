export function SectionMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`px-8 md:px-16 pt-8 ${dark ? "text-paper" : "text-ink"}`}>
      <span className="font-serif text-[32px] leading-none">λ</span>
    </div>
  );
}
