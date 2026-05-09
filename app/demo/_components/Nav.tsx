import Link from "next/link";
import { Logo } from "@/app/_components/Logo";

export function Nav() {
  return (
    <header className="border-b border-ink">
      <div className="px-6 md:px-10 py-5 flex items-center justify-between">
        <Logo href="/" />
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 hover:text-ink transition-colors"
        >
          ← back
        </Link>
      </div>
    </header>
  );
}
