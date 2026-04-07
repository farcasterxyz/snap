import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Farcaster Snap";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16162a 100%)",
          gap: 32,
        }}
      >
        {/* Farcaster icon */}
        <svg
          width="120"
          height="106"
          viewBox="0 0 520 457"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M519.801 0V61.6809H458.172V123.31H477.054V123.331H519.801V456.795H416.57L416.507 456.49L363.832 207.03C358.81 183.251 345.667 161.736 326.827 146.434C307.988 131.133 284.255 122.71 260.006 122.71H259.8C235.551 122.71 211.818 131.133 192.979 146.434C174.139 161.736 160.996 183.259 155.974 207.03L103.239 456.795H0V123.323H42.7471V123.31H61.6262V61.6809H0V0H519.801Z"
            fill="#8A63D2"
          />
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            Farcaster Snap
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#a0a0b8",
              maxWidth: 600,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Simple, Nimble App Protocol
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
