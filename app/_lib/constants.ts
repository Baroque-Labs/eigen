// Founding-round counters and the Stripe checkout URL — referenced by Hero
// (homepage) and Founding (homepage). Update these as the round progresses.

export const SPOTS_REMAINING = 5;
export const SPOTS_TOTAL = 10;
export const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "#";
