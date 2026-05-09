import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Eigen — Email that optimizes itself";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const buf = await readFile(
    join(process.cwd(), "public/parliament-sunset.jpg"),
  );
  const monet = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#FFFFFF",
          color: "#000000",
        }}
      >
        {/* Image — 60% */}
        <div
          style={{
            display: "flex",
            width: "60%",
            height: "100%",
            borderRight: "1px solid #000000",
            overflow: "hidden",
          }}
        >
          <img
            // @ts-expect-error ImageResponse accepts ArrayBuffer for src
            src={monet}
            width={720}
            height={630}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>

        {/* Content — 40% */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "40%",
            height: "100%",
            padding: "48px",
          }}
        >
          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: "serif", fontSize: 56, lineHeight: 1 }}>
              λ
            </span>
            <span
              style={{
                fontFamily: "serif",
                fontSize: 40,
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              Eigen
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 420,
            }}
          >
            <div
              style={{
                fontFamily: "serif",
                fontSize: 68,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
              }}
            >
              Email that optimizes itself.
            </div>
            <div
              style={{
                marginTop: 24,
                fontSize: 18,
                lineHeight: 1.45,
                color: "rgba(0,0,0,0.75)",
              }}
            >
              Thompson sampling over your variants. Bayesian. Continuous.
            </div>
          </div>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "monospace",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "rgba(0,0,0,0.6)",
            }}
          >
            <span>est. 2026</span>
            <span>v0 · founding round</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
