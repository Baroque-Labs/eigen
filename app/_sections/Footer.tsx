import { Logo } from "@/app/_components/Logo";

export function Footer() {
  return (
    <footer className="section-black bg-ink text-paper">
      <div className="px-8 md:px-16 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <Logo />

          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12 font-mono text-[12px] uppercase tracking-[0.14em] text-paper/70">
            <span>© {new Date().getFullYear()} Baroque Labs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
