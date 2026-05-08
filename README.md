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
public/parliament-sunset.jpg   — used in the hero (lightest, atmospheric)
public/parliament-fog.jpg      — used as a bordered inset in the math section
public/parliament-stormy.jpg   — used as the dominant visual in the founding section
```

All three also appear together in the variant strip between Math and Founding. The site will render without them (broken images), but the layout assumes they exist. They should already be black-and-white — no CSS filters are applied.

## Placeholders to replace

- `STRIPE_LINK_HERE` — search `app/page.tsx` for the Stripe Payment Link
- `SPOTS_REMAINING` — top of `app/page.tsx`, currently `7`
- OG image — `public/og.png` (referenced in `app/layout.tsx`)
- Footer Twitter href — `https://twitter.com/`
- Footer email — `hello@eigen.email`

## Deploy

```bash
npm i -g vercel
vercel
```

Or push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new). No environment variables required.

## Structure

```
app/
  layout.tsx     fonts, metadata, favicon
  page.tsx       single-page landing — all sections
  BetaPlot.tsx   static SVG of three Beta posteriors
  globals.css    base styles + grain overlay
public/
  favicon.svg            λ in serif
  parliament-sunset.jpg  (you supply — Monet 1903, B&W)
  parliament-fog.jpg     (you supply — Monet 1904, B&W)
  parliament-stormy.jpg  (you supply — Monet 1904, B&W)
```

## Design constraints (don't break these)

- Pure black `#000` and pure white `#FFF` only — no grays for backgrounds
- 1px hairline borders, never gray
- No box shadows, no gradients, no rounded corners except CTA buttons (4px max)
- λ is the brand mark — render it as a serif character, never as an SVG logo or image
