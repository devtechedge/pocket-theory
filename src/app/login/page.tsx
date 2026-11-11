import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/domains/auth/session";
import { isDemoMode } from "@/env";
import { sanitizeInternalPath } from "@/lib/security/redirect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  const safeNext = sanitizeInternalPath(next);
  if (user) {
    redirect(safeNext);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <LoginForm demoMode={isDemoMode()} nextPath={safeNext} />
    </div>
  );
}
