"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ComplianceStatus, ProductStatus } from "@/db/schema";

interface CategoryChoice {
  id: string;
  name: string;
}

export interface ProductEditorInitialData {
  id?: string;
  sku: string;
  slug: string;
  categoryId: string;
  title: string;
  subtitle: string;
  description: string;
  pricePaise: number;
  mrpPaise: number;
  hsnCode: string;
  warrantyMonths: number;
  warrantyTerms: string;
  returnWindowDays: number;
  genericName: string;
  modelNumber: string;
  countryOfOrigin: string;
  manufacturerDetails: string;
  importerDetails: string;
  customerCareContact: string;
  requiresBisCrs: boolean;
  bisRegistrationNumber: string;
  requiresWpcEta: boolean;
  wpcEtaNumber: string;
  safetyNotes: string;
  complianceStatus: ComplianceStatus;
  status: ProductStatus;
  isFeatured: boolean;
  isNewDrop: boolean;
}

export function ProductEditorForm({
  mode,
  categories,
  initial,
}: {
  mode: "create" | "edit";
  categories: CategoryChoice[];
  initial: ProductEditorInitialData;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [gateReasons, setGateReasons] = useState<string[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setGateReasons([]);
    setSavedNotice(null);

    try {
      const url =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${initial.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        id?: string;
        error?: string;
        reasons?: string[];
      };

      if (!res.ok) {
        setError(data.error ?? "Save rejected.");
        setGateReasons(data.reasons ?? []);
        return;
      }

      if (mode === "create" && data.id) {
        router.push(`/admin/products/${data.id}`);
      } else {
        setSavedNotice("Product & compliance changes saved and audited.");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="admin-product-form"
      className="space-y-6 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 text-xs"
    >
      {error && (
        <div
          role="alert"
          data-testid="admin-compliance-error"
          className="rounded-lg border border-pt-danger/40 bg-pt-danger-soft p-4 text-pt-danger-ink"
        >
          <p className="font-bold">{error}</p>
          {gateReasons.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {gateReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {savedNotice && (
        <div
          role="status"
          data-testid="admin-product-saved"
          className="rounded-lg border border-pt-lime-ink/30 bg-pt-lime-soft p-3 font-semibold text-pt-lime-ink"
        >
          {savedNotice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="adm-sku" className="block font-mono font-bold uppercase">
            SKU
          </label>
          <input
            id="adm-sku"
            required
            disabled={mode === "edit"}
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="adm-slug" className="block font-mono font-bold uppercase">
            URL Slug
          </label>
          <input
            id="adm-slug"
            required
            disabled={mode === "edit"}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="adm-cat" className="block font-mono font-bold uppercase">
            Category
          </label>
          <select
            id="adm-cat"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="adm-title" className="block font-mono font-bold uppercase">
            Product Title
          </label>
          <input
            id="adm-title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            data-testid="admin-product-title"
            className="mt-1 h-9 w-full rounded border border-pt-border-strong bg-pt-surface px-2.5"
          />
        </div>
        <div>
          <label htmlFor="adm-sub" className="block font-mono font-bold uppercase">
            Concise Subtitle
          </label>
          <input
            id="adm-sub"
            required
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5"
          />
        </div>
      </div>

      <div>
        <label htmlFor="adm-desc" className="block font-mono font-bold uppercase">
          Editorial Copy (Prohibited superlatives are blocked by Gate)
        </label>
        <textarea
          id="adm-desc"
          required
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-1 w-full rounded border border-pt-border bg-pt-surface p-2.5"
        />
      </div>

      {/* Pricing in Integer Paise */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="adm-price" className="block font-mono font-bold uppercase">
            Selling Price (Integer Paise)
          </label>
          <input
            id="adm-price"
            type="number"
            required
            value={form.pricePaise}
            onChange={(e) =>
              setForm({ ...form, pricePaise: Number(e.target.value) })
            }
            data-testid="admin-product-price-paise"
            className="mt-1 h-9 w-full rounded border border-pt-border-strong bg-pt-surface px-2.5 font-mono"
          />
        </div>
        <div>
          <label htmlFor="adm-mrp" className="block font-mono font-bold uppercase">
            MRP Incl. Taxes (Integer Paise)
          </label>
          <input
            id="adm-mrp"
            type="number"
            required
            value={form.mrpPaise}
            onChange={(e) =>
              setForm({ ...form, mrpPaise: Number(e.target.value) })
            }
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono"
          />
        </div>
        <div>
          <label htmlFor="adm-hsn" className="block font-mono font-bold uppercase">
            HSN Code
          </label>
          <input
            id="adm-hsn"
            required
            value={form.hsnCode}
            onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono"
          />
        </div>
      </div>

      {/* Statutory Legal Metrology & Compliance Gate Controls */}
      <div className="rounded-lg border border-pt-border bg-pt-surface p-4 space-y-4">
        <h3 className="font-mono text-xs font-bold text-pt-cobalt uppercase">
          Indian Legal Metrology, BIS CRS & WPC ETA Publication Gate
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="adm-generic" className="block font-mono font-bold uppercase">
              Generic Commodity Name
            </label>
            <input
              id="adm-generic"
              required
              value={form.genericName}
              onChange={(e) => setForm({ ...form, genericName: e.target.value })}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5"
            />
          </div>
          <div>
            <label htmlFor="adm-model" className="block font-mono font-bold uppercase">
              Model Number
            </label>
            <input
              id="adm-model"
              required
              value={form.modelNumber}
              onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5 font-mono"
            />
          </div>
          <div>
            <label htmlFor="adm-origin" className="block font-mono font-bold uppercase">
              Country of Origin
            </label>
            <input
              id="adm-origin"
              required
              value={form.countryOfOrigin}
              onChange={(e) =>
                setForm({ ...form, countryOfOrigin: e.target.value })
              }
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="adm-mfg" className="block font-mono font-bold uppercase">
              Manufacturer / Packer
            </label>
            <input
              id="adm-mfg"
              required
              value={form.manufacturerDetails}
              onChange={(e) =>
                setForm({ ...form, manufacturerDetails: e.target.value })
              }
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5"
            />
          </div>
          <div>
            <label htmlFor="adm-imp" className="block font-mono font-bold uppercase">
              Importer / Marketed By
            </label>
            <input
              id="adm-imp"
              required
              value={form.importerDetails}
              onChange={(e) =>
                setForm({ ...form, importerDetails: e.target.value })
              }
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={form.requiresBisCrs}
                onChange={(e) =>
                  setForm({ ...form, requiresBisCrs: e.target.checked })
                }
                className="accent-pt-tangerine"
              />
              <span>Requires BIS CRS Registration</span>
            </label>
            <input
              placeholder="BIS CRS Ref (leave blank unless verified)"
              value={form.bisRegistrationNumber}
              onChange={(e) =>
                setForm({ ...form, bisRegistrationNumber: e.target.value })
              }
              className="h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={form.requiresWpcEta}
                onChange={(e) =>
                  setForm({ ...form, requiresWpcEta: e.target.checked })
                }
                className="accent-pt-tangerine"
              />
              <span>Requires WPC ETA Wireless Clearance</span>
            </label>
            <input
              placeholder="WPC ETA Ref (leave blank unless verified)"
              value={form.wpcEtaNumber}
              onChange={(e) =>
                setForm({ ...form, wpcEtaNumber: e.target.value })
              }
              className="h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5 font-mono"
            />
          </div>
        </div>

        <div>
          <label htmlFor="adm-safe" className="block font-mono font-bold uppercase">
            Safety & Battery / Thermal Notes
          </label>
          <textarea
            id="adm-safe"
            required
            rows={2}
            value={form.safetyNotes}
            onChange={(e) => setForm({ ...form, safetyNotes: e.target.value })}
            className="mt-1 w-full rounded border border-pt-border bg-pt-surface-elevated p-2.5"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="adm-comp-status"
              className="block font-mono font-bold uppercase"
            >
              Compliance Evidence State
            </label>
            <select
              id="adm-comp-status"
              value={form.complianceStatus}
              onChange={(e) =>
                setForm({
                  ...form,
                  complianceStatus: e.target.value as ComplianceStatus,
                })
              }
              data-testid="admin-compliance-status"
              className="mt-1 h-9 w-full rounded border border-pt-border-strong bg-pt-surface-elevated px-2 font-mono"
            >
              <option value="DEMO_ILLUSTRATIVE">DEMO_ILLUSTRATIVE</option>
              <option value="PENDING_REVIEW">PENDING_REVIEW (Holds Draft)</option>
              <option value="MISSING_EVIDENCE">MISSING_EVIDENCE (Blocks Publish)</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED (Blocks Publish)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="adm-pub-status"
              className="block font-mono font-bold uppercase"
            >
              Requested Listing Status
            </label>
            <select
              id="adm-pub-status"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ProductStatus })
              }
              data-testid="admin-publish-status"
              className="mt-1 h-9 w-full rounded border border-pt-border-strong bg-pt-surface-elevated px-2 font-mono"
            >
              <option value="ACTIVE">ACTIVE (Published)</option>
              <option value="DRAFT">DRAFT (Hidden from Storefront)</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-semibold">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            className="accent-pt-tangerine"
          />
          <span>Featured on Homepage</span>
        </label>
        <label className="flex items-center gap-2 font-semibold">
          <input
            type="checkbox"
            checked={form.isNewDrop}
            onChange={(e) => setForm({ ...form, isNewDrop: e.target.checked })}
            className="accent-pt-tangerine"
          />
          <span>New Drop Badge</span>
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={busy}
        data-testid="admin-product-save"
      >
        {busy
          ? "Validating Gate & Saving..."
          : mode === "create"
            ? "Create SKU"
            : "Save Product & Verify Compliance Gate"}
      </Button>
    </form>
  );
}
