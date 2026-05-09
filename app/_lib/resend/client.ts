// Singleton-ish Resend client. The instance is created lazily so build
// time and routes that don't touch email don't require the API key to
// be set. Note the env var is namespaced (`RESEND_EIGEN_API_KEY`),
// not the SDK default `RESEND_API_KEY`.

import "server-only";
import { Resend } from "resend";

let cached: Resend | undefined;

export function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_EIGEN_API_KEY;
  if (!key) throw new Error("RESEND_EIGEN_API_KEY is not set");
  cached = new Resend(key);
  return cached;
}
