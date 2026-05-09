// Per-request helper that resolves the signed-in Clerk user to their
// Eigen organization, creating both the org and the membership row on
// first dashboard hit. React's cache() dedupes within a request so
// pages and the layout share the same lookup.

import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { memberships, organizations } from "@/db/schema";

export type ResolvedOrg = {
  id: string;
  name: string;
};

export type AuthedRequest = {
  userId: string;
  greetingName: string;
  org: ResolvedOrg;
};

function pickGreetingName(user: {
  firstName: string | null;
  username: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
}): string {
  return (
    user.firstName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress.split("@")[0] ||
    "there"
  );
}

export const requireOrg = cache(async (): Promise<AuthedRequest> => {
  const user = await currentUser();
  if (!user) {
    // Clerk middleware should have redirected before this fires; the
    // throw is a defensive guard against a misconfigured route.
    throw new Error("requireOrg called without a signed-in user");
  }

  const db = getDb();
  const greetingName = pickGreetingName(user);

  const existing = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.orgId, organizations.id))
    .where(eq(memberships.clerkUserId, user.id))
    .limit(1);

  if (existing.length > 0) {
    return { userId: user.id, greetingName, org: existing[0] };
  }

  const [org] = await db
    .insert(organizations)
    .values({ name: `${greetingName}'s workspace` })
    .returning({ id: organizations.id, name: organizations.name });
  await db
    .insert(memberships)
    .values({ clerkUserId: user.id, orgId: org.id, role: "owner" });

  return { userId: user.id, greetingName, org };
});
