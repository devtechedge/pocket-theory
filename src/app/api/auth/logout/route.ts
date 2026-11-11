import { NextResponse } from "next/server";
import { clearCurrentSession } from "@/domains/auth/session";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await clearCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Logout failed." }, { status: 500 });
  }
}
