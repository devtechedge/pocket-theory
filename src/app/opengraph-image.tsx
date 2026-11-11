import { ImageResponse } from "next/og";

export const alt = "POCKET THEORY - Useful tech. Zero fuss.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#111418",
          color: "#EDF1F7",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "#FF6B2B",
              }}
            />
            <span
              style={{
                fontSize: "26px",
                fontWeight: 800,
                letterSpacing: "0.08em",
              }}
            >
              POCKET THEORY
            </span>
          </div>
          <span
            style={{
              fontSize: "18px",
              color: "#84ADFF",
              fontWeight: 700,
            }}
          >
            INDIA // 40 HARDWARE SKUS // INR
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              lineHeight: 1.05,
            }}
          >
            Useful tech. Zero fuss.
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#A6B2C2",
              maxWidth: "920px",
              lineHeight: 1.35,
            }}
          >
            GaN Charging, ANC & Open-Ear Audio, Smartwatches, Mechanical Desk
            Gear & Supercapacitor Automotive Tools.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px solid #2C3746",
            paddingTop: "24px",
            fontSize: "18px",
            color: "#A6B2C2",
          }}
        >
          <span>Transparent Spec Matrix & Compatibility</span>
          <span>Integer-Paise GST Checkout & PIN Coverage</span>
        </div>
      </div>
    ),
    size,
  );
}
