import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { CheckoutKillSwitch } from "@/components/admin/AdminSettingsClient";
import { Badge } from "@/components/ui/Badge";
import { getDb } from "@/db/client";
import { auditLogs, emailOutbox, storeSettings } from "@/db/schema";
import { requirePageCapability } from "@/domains/auth/rbac";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audit Log, Outbox & Settings",
  robots: { index: false, follow: false },
};

export default async function AdminAuditAndSettingsPage() {
  const actor = await requirePageCapability("MANAGE_USERS_AND_SETTINGS");
  const db = await getDb();

  const [logs, emails, [checkoutSetting]] = await Promise.all([
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(40),
    db
      .select()
      .from(emailOutbox)
      .orderBy(desc(emailOutbox.createdAt))
      .limit(20),
    db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.key, "checkout_enabled"))
      .limit(1),
  ]);

  const checkoutEnabled = checkoutSetting?.valueJson?.enabled !== false;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <CheckoutKillSwitch initialEnabled={checkoutEnabled} />

      <section className="rounded-xl border border-pt-border bg-pt-surface-elevated p-5">
        <h1 className="font-display text-lg font-bold text-pt-ink">
          Immutable Privileged Mutation Audit Log ({logs.length})
        </h1>
        <ul className="mt-3 divide-y divide-pt-border text-xs">
          {logs.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-start justify-between gap-2 py-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="cobalt">{l.action}</Badge>
                  <span className="font-mono text-pt-ink-muted">
                    {l.actorEmail} ({l.actorRole})
                  </span>
                </div>
                <p className="mt-1 font-medium text-pt-ink">{l.summary}</p>
              </div>
              <span className="font-mono text-[0.6875rem] text-pt-ink-muted">
                {new Date(l.createdAt).toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-pt-border bg-pt-surface-elevated p-5">
        <h2 className="font-display text-lg font-bold text-pt-ink">
          Development Transactional Email Sink (`email_outbox`)
        </h2>
        {emails.length === 0 ? (
          <p className="mt-2 text-xs text-pt-ink-muted">
            No transactional messages queued yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-pt-border text-xs">
            {emails.map((m) => (
              <li key={m.id} className="py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-pt-ink">{m.subject}</span>
                  <Badge tone="neutral">{m.deliveryMode}</Badge>
                </div>
                <p className="font-mono text-[0.6875rem] text-pt-ink-muted">
                  To: {m.toEmail} | Template: {m.template}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
