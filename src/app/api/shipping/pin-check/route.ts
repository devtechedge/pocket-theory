import { NextResponse } from "next/server";
import type { ShippingClass } from "@/db/schema";
import { estimatePinDelivery } from "@/domains/shipping/pin-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pin = url.searchParams.get("pin") ?? "";
  const rawClass = url.searchParams.get("shippingClass");
  const shippingClass: ShippingClass =
    rawClass === "LITHIUM_SURFACE" || rawClass === "BULKY"
      ? rawClass
      : "STANDARD";

  const estimate = estimatePinDelivery(pin, shippingClass);
  return NextResponse.json(
    { estimate },
    { status: estimate.valid ? 200 : 400 },
  );
}
