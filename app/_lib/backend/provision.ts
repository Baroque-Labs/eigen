// One-time provisioning of a backend org + API key for an eigen org.
// Called the first time a Clerk-authed user hits a dashboard page (lazy),
// or from a Clerk webhook (eager) — whichever fires first.

import "server-only";
import { createHash } from "crypto";
import { getDb } from "@/db";
import { apiKeys } from "@/db/schema";
import type { ResolvedOrg } from "@/app/_lib/auth/org";

const BACKEND_URL = process.env.EIGEN_BACKEND_URL ?? "http://localhost:8000";
const BACKEND_MASTER_KEY = process.env.EIGEN_BACKEND_MASTER_KEY ?? "";

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function provisionBackendForOrg(org: ResolvedOrg): Promise<string> {
  if (!BACKEND_MASTER_KEY) {
    throw new Error(
      "EIGEN_BACKEND_MASTER_KEY not set — cannot provision backend org/key",
    );
  }

  // Create the backend org. Idempotent on (name) — re-creating returns 409,
  // which we treat as "ok, already there".
  const orgRes = await fetch(`${BACKEND_URL}/admin/orgs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BACKEND_MASTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: `eigen-${org.id}` }),
  });
  let backendOrgId: number;
  if (orgRes.status === 409) {
    // Another tab raced us. Look it up.
    // (No GET /admin/orgs/by-name endpoint yet — we'd need to add one for full
    //  correctness. For MVP we surface the error so the operator can retry.)
    throw new Error(
      `Backend org for ${org.id} already exists but we couldn't fetch its id`,
    );
  } else if (!orgRes.ok) {
    throw new Error(`Failed to create backend org: ${await orgRes.text()}`);
  } else {
    const body = await orgRes.json();
    backendOrgId = body.id;
  }

  // Mint a key for that org.
  const keyRes = await fetch(`${BACKEND_URL}/admin/keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BACKEND_MASTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ org_id: backendOrgId, label: "dashboard" }),
  });
  if (!keyRes.ok) {
    throw new Error(`Failed to mint backend key: ${await keyRes.text()}`);
  }
  const { api_key: raw } = (await keyRes.json()) as { api_key: string };

  // Store both the hash (for revocation/audit) and the raw key (for outbound
  // calls). Raw needs encryption-at-rest before prod — see schema TODO.
  const db = getDb();
  await db.insert(apiKeys).values({
    orgId: org.id,
    keyHash: sha256(raw),
    rawKey: raw,
    label: "dashboard",
  });

  return raw;
}
