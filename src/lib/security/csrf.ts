import type { NextRequest } from "next/server";

export class CsrfOriginError extends Error {
  constructor(message = "Cross-origin mutation rejected.") {
    super(message);
    this.name = "CsrfOriginError";
  }
}

/**
 * Validates that mutating browser requests originate from the same host.
 * Allows same-origin requests in local dev, preview aliases, and production.
 */
export function assertSameOrigin(req: NextRequest | Request): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }

  const hostHeader =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!hostHeader) {
    return;
  }
  const expectedHost = hostHeader.split(",")[0]!.trim().toLowerCase();

  const origin = req.headers.get("origin");
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host.toLowerCase();
    } catch {
      throw new CsrfOriginError("Malformed Origin header.");
    }
    if (originHost !== expectedHost) {
      throw new CsrfOriginError(
        `Origin "${originHost}" does not match host "${expectedHost}".`,
      );
    }
    return;
  }

  const referer = req.headers.get("referer");
  if (referer) {
    let refererHost: string;
    try {
      refererHost = new URL(referer).host.toLowerCase();
    } catch {
      throw new CsrfOriginError("Malformed Referer header.");
    }
    if (refererHost !== expectedHost) {
      throw new CsrfOriginError("Referer host mismatch.");
    }
  }
}
