"use client";

import { useActionState } from "react";
import { addDomain } from "@/app/_lib/domains/actions";

export function AddDomainForm() {
  const [state, formAction, pending] = useActionState(addDomain, null);

  return (
    <form action={formAction} className="flex gap-2 items-start">
      <div className="flex-1">
        <input
          name="hostname"
          required
          placeholder="mail.example.com"
          className="w-full border border-ink/15 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-ink/40"
        />
        {state?.error ? (
          <p className="text-xs text-red-700 mt-1">{state.error}</p>
        ) : (
          <p className="text-xs text-ink/40 mt-1">
            Use a dedicated subdomain (e.g. mail.yourdomain.com) so sender
            reputation stays isolated from your primary domain.
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm rounded bg-ink text-paper hover:bg-ink/90 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
