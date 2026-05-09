import Link from "next/link";
import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const greetingName =
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress.split("@")[0] ||
    "there";

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-ink/10 px-4 py-6 flex flex-col gap-6 bg-paper">
        <div className="font-serif text-2xl">Eigen</div>
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
          <UserButton
            appearance={{
              elements: { rootBox: "flex items-center" },
            }}
          />
          <span className="text-sm text-ink/70">Hi, {greetingName}</span>
        </div>
      </aside>
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
