// Smoke-test function — proves the Inngest wiring without depending on
// any of the real bandit infrastructure (DB, Resend, etc.). Trigger
// from the dev UI by sending a `test/hello` event. Delete once the
// per-recipient send job lands and we have a real function to show.

import { inngest } from "../client";

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    name: "Hello world",
    triggers: [{ event: "test/hello" }],
  },
  async ({ event }) => {
    const name = (event.data as { name?: string } | undefined)?.name ?? "world";
    return { message: `Hello, ${name}` };
  },
);
