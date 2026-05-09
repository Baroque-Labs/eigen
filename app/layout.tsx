import type { Metadata } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : new URL("https://eigentest.com");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Eigen — Email that optimizes itself",
  description:
    "Eigen is an autonomous email optimization platform. It runs Thompson sampling over your variants, kills losers, and spawns new ones from winners — automatically.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Eigen — Email that optimizes itself",
    description:
      "Autonomous email optimization. Bayesian. Continuous. No more A/B tests.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eigen — Email that optimizes itself",
    description:
      "Autonomous email optimization. Bayesian. Continuous. No more A/B tests.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${instrumentSerif.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <body className="font-sans bg-paper text-ink antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
