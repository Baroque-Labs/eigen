# Eigen

Single-page landing site for **Eigen** — an autonomous email optimization platform.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required assets

Drop the three pre-desaturated Monet "Houses of Parliament" paintings at:

```
public/parliament-sunset.jpg
public/parliament-fog.jpg
public/parliament-stormy.jpg
```

All three are used only in the hero, where they crossfade on a 24s loop (8s per painting, 1s overlapping crossfades). The site will render without them (broken images), but the hero is built around them. They should already be black-and-white — no CSS filters are applied.

## Placeholders to replace

- Stripe Payment Link — `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` env var (read in `app/_lib/constants.ts`)
- `SPOTS_REMAINING` / `SPOTS_TOTAL` — `app/_lib/constants.ts`
- OG image — `public/og.png` (referenced in `app/layout.tsx`)

## Structure

```
app/
  layout.tsx              fonts, metadata, favicon
  globals.css             base styles + grain overlay
  page.tsx                homepage (composes _sections)
  opengraph-image.tsx     1200×630 OG image generator
  _components/            shared UI: Logo, MonoLabel, SectionHeader, CTAButton
  _lib/                   beta.ts (Beta math), constants.ts (spots/checkout)
  _sections/              homepage sections: Hero, AllocatorSection, MathSection, Founding, FAQ, Footer
  _data/                  hardcoded copy & scenarios: faq, founding-benefits, allocator-scenario, math-variants
  allocator/              animated allocation diagram (homepage)
  beta-plot/              static Beta posterior SVG (homepage math section)
  claim/success/          post-Stripe success page
  demo/                   live Thompson-sampling demo
    page.tsx              orchestrator: phase machine + replacement loop
    _types.ts             SimState, Variant, Phase, etc.
    _constants.ts         STARTER_EMAIL, PAINT_PALETTE, all thresholds
    _simulation/          pure functions: tick, probability, victims, email
    _components/          Nav, InputPhase, GeneratingPhase, SimulationPhase, cards/tables
    _charts/              the four SVG charts + ChartCard frame
  api/demo/
    route.ts              POST handler + dispatch
    _prompts.ts           Claude system + user prompts
    _parse.ts             JSON extraction + validation
    _fallbacks.ts         hardcoded variants when the API fails
    _claude.ts            Anthropic SDK wrapper (model name lives here)
public/
  favicon.svg             λ in serif
  parliament-sunset.jpg   (you supply — Monet 1903, B&W)
  parliament-fog.jpg      (you supply — Monet 1904, B&W)
  parliament-stormy.jpg   (you supply — Monet 1904, B&W)
```

The `@/*` TypeScript path alias maps to repo root, so cross-folder imports
look like `import { Logo } from "@/app/_components/Logo"`.

## Design constraints (don't break these)

- Pure black `#000` and pure white `#FFF` only — no grays for backgrounds
- 1px hairline borders, never gray
- No box shadows, no gradients, no rounded corners except CTA buttons (4px max)
- λ is the brand mark — render it as a serif character, never as an SVG logo or image
