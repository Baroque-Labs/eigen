// Thin client for the eigen-backend service. All callers go through here
// so we have exactly one place where the per-org API key is injected and
// the base URL is configured.
//
// Never expose the raw API key to the browser — all dashboard pages call
// this from server components or server actions only.

import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { apiKeys } from "@/db/schema";
import { requireOrg, type ResolvedOrg } from "@/app/_lib/auth/org";
import { provisionBackendForOrg } from "@/app/_lib/backend/provision";

const BACKEND_URL = process.env.EIGEN_BACKEND_URL ?? "http://localhost:8000";

export class BackendError extends Error {
  constructor(public status: number, public body: string) {
    super(`backend ${status}: ${body}`);
  }
}

async function loadOrgKey(org: ResolvedOrg): Promise<string> {
  // Cache the resolved key in process for the request. Drizzle stores only
  // the hash + the live raw value in an indirection table (api_key_raw),
  // so we keep the secret out of the main keys table for at-rest safety.
  const db = getDb();
  const rows = await db
    .select({ raw: apiKeys.rawKey })
    .from(apiKeys)
    .where(eq(apiKeys.orgId, org.id))
    .limit(1);
  if (rows.length > 0 && rows[0].raw) return rows[0].raw;

  // First call from this org — provision a backend org + key on demand.
  const raw = await provisionBackendForOrg(org);
  return raw;
}

export type FetchInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function backendFetch<T = unknown>(
  path: string,
  init: FetchInit = {},
): Promise<T> {
  const { org } = await requireOrg();
  const key = await loadOrgKey(org);

  const url = `${BACKEND_URL}${path}`;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key}`);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new BackendError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
