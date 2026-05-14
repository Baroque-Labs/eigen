import Link from "next/link";
import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { requireOrg } from "@/app/_lib/auth/org";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Sign-in and sign-up pages share this layout but have no signed-in
  // user yet. Render the children bare so Clerk's widgets can mount
  // without the dashboard chrome (and without trying to look up an org).
  if (process.env.EIGEN_DEV_BYPASS_CLERK !== "1") {
    const user = await currentUser();
    if (!user) {
      return <>{children}</>;
    }
  }

  const { greetingName, org } = await requireOrg();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-ink/10 px-4 py-6 flex flex-col gap-6 bg-paper">
        <div>
          <div className="font-serif text-2xl">Eigen</div>
          <div className="text-xs text-ink/50 mt-1">{org.name}</div>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/campaigns"
            className="px-2 py-1.5 rounded hover:bg-ink/5"
          >
            Campaigns
          </Link>
          <Link
            href="/domains"
            className="px-2 py-1.5 rounded hover:bg-ink/5"
          >
            Domains
          </Link>
          <Link
            href="/settings"
            className="px-2 py-1.5 rounded hover:bg-ink/5"
          >
            Settings
          </Link>
        </nav>
        <div className="mt-auto flex items-center gap-3">
          {process.env.EIGEN_DEV_BYPASS_CLERK === "1" ? (
            <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-xs font-mono">
              {greetingName.slice(0, 1)}
            </div>
          ) : (
            <UserButton
              appearance={{
                elements: { rootBox: "flex items-center" },
              }}
            />
          )}
          <span className="text-sm text-ink/70">Hi, {greetingName}</span>
        </div>
      </aside>
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
