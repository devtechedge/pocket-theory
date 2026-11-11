"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("Order & Shipping Support");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          topic,
          orderNumber,
          message,
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Submission failed.");
        return;
      }
      setStatusMsg(data.message ?? "Recorded.");
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <Badge tone="cobalt">Consumer Support & Grievance Desk</Badge>
          <h1 className="font-display text-2xl font-bold text-pt-ink sm:text-3xl">
            Contact Pocket Theory
          </h1>
          <p className="text-xs leading-relaxed text-pt-ink-muted">
            Published in accordance with the Consumer Protection (E-Commerce)
            Rules, 2020 (illustrative demo entity contact details):
          </p>

          <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-4 text-xs space-y-2">
            <p className="font-mono font-bold text-pt-ink uppercase">
              Grievance Officer & Nodal Desk (Demo Entity)
            </p>
            <p className="text-pt-ink">
              <strong>Officer:</strong> Grievance Redressal Desk, Pocket Theory
              Consumer Devices
            </p>
            <p className="text-pt-ink-muted">
              <strong>Address:</strong> Unit 4B, Industrial Estate, Lower Parel,
              Mumbai, Maharashtra - 400013
            </p>
            <p className="font-mono text-pt-ink">
              Email: grievance@pockettheory.example
            </p>
            <p className="font-mono text-pt-ink">
              Support: +91-22-4090-0100 (Mon-Sat, 10:00-18:00 IST)
            </p>
            <p className="text-pt-ink-muted">
              <strong>SLA:</strong> Ticket acknowledgement within 48 hours;
              resolution within 30 days of receipt.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 text-xs lg:col-span-7"
        >
          <h2 className="font-display text-lg font-bold text-pt-ink">
            Send a Support or Warranty Inquiry
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cnt-name" className="block font-mono font-bold uppercase">
                Full Name
              </label>
              <input
                id="cnt-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5"
              />
            </div>
            <div>
              <label htmlFor="cnt-email" className="block font-mono font-bold uppercase">
                Email
              </label>
              <input
                id="cnt-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cnt-topic" className="block font-mono font-bold uppercase">
                Topic
              </label>
              <select
                id="cnt-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2"
              >
                <option>Order & Shipping Support</option>
                <option>Warranty Claim</option>
                <option>Compatibility Question</option>
                <option>Grievance Officer Escalation</option>
              </select>
            </div>
            <div>
              <label htmlFor="cnt-ord" className="block font-mono font-bold uppercase">
                Order Number (Optional)
              </label>
              <input
                id="cnt-ord"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="PT-2026-10001"
                className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono"
              />
            </div>
          </div>
          <div>
            <label htmlFor="cnt-phone" className="block font-mono font-bold uppercase">
              Mobile (Optional)
            </label>
            <input
              id="cnt-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono"
            />
          </div>
          <div>
            <label htmlFor="cnt-msg" className="block font-mono font-bold uppercase">
              Message
            </label>
            <textarea
              id="cnt-msg"
              required
              minLength={10}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded border border-pt-border bg-pt-surface p-2.5"
            />
          </div>

          {error && <p className="text-pt-danger">{error}</p>}
          {statusMsg && (
            <p
              role="status"
              className="rounded border border-pt-lime-ink/30 bg-pt-lime-soft p-2.5 font-semibold text-pt-lime-ink"
            >
              {statusMsg}
            </p>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? "Recording..." : "Submit Inquiry"}
          </Button>
        </form>
      </div>
    </div>
  );
}
