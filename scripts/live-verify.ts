/**
 * Live smoke verification for POCKET THEORY.
 *
 * Usage:
 *   npm run smoke:live                      # probes http://localhost:3000
 *   npm run smoke:live -- --base https://pocket-theory.vercel.app
 *   BASE_URL=https://... npm run smoke:live
 *
 * Exits with code 1 when any probe fails, and prints one compact line per probe.
 * The non-charging demo checkout flow is intentionally left for manual
 * verification (docs/DEPLOYMENT.md, step 4), because a full purchase cycle
 * mutates cart and order state.
 */

interface Probe {
  name: string;
  run: () => Promise<{ ok: boolean; detail: string }>;
}

function resolveBaseUrl(): string {
  const flagIndex = process.argv.indexOf("--base");
  const fromFlag = flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;
  const raw = fromFlag ?? process.env.BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

async function getJson(url: string): Promise<{ status: number; json: unknown }> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const probes: Probe[] = [
  {
    name: "health",
    run: async () => {
      const base = resolveBaseUrl();
      const { status, json } = await getJson(`${base}/api/health`);
      if (status !== 200 || !isRecord(json) || json.status !== "ok") {
        return { ok: false, detail: `status=${status}` };
      }
      const dbDriver = String(json.dbDriver ?? "?");
      const demoMode = String(json.demoMode ?? "?");
      const activeSkus = String(json.activeSkus ?? "?");
      return {
        ok: true,
        detail: `db=${dbDriver} demo=${demoMode} activeSkus=${activeSkus}`,
      };
    },
  },
  {
    name: "homepage+security-headers",
    run: async () => {
      const base = resolveBaseUrl();
      const res = await fetch(base);
      const text = await res.text();
      const csp = res.headers.get("content-security-policy") ?? "";
      if (res.status !== 200) {
        return { ok: false, detail: `status=${res.status}` };
      }
      if (!csp.includes("default-src 'self'")) {
        return { ok: false, detail: "CSP header missing" };
      }
      if (!text.toLowerCase().includes("pocket theory")) {
        return { ok: false, detail: "brand text missing" };
      }
      return { ok: true, detail: `status=200 csp=yes bytes=${text.length}` };
    },
  },
  {
    name: "robots.txt",
    run: async () => {
      const base = resolveBaseUrl();
      const res = await fetch(`${base}/robots.txt`);
      return { ok: res.status === 200, detail: `status=${res.status}` };
    },
  },
  {
    name: "sitemap.xml",
    run: async () => {
      const base = resolveBaseUrl();
      const res = await fetch(`${base}/sitemap.xml`);
      const text = await res.text();
      const ok = res.status === 200 && text.includes("<urlset");
      return { ok, detail: `status=${res.status} urlset=${ok}` };
    },
  },
  {
    name: "catalogue (shop)",
    run: async () => {
      const base = resolveBaseUrl();
      const res = await fetch(`${base}/shop`);
      const text = await res.text();
      return { ok: res.status === 200 && text.length > 2_000, detail: `status=${res.status} bytes=${text.length}` };
    },
  },
  {
    name: "compare page",
    run: async () => {
      const base = resolveBaseUrl();
      const res = await fetch(`${base}/compare`);
      return { ok: res.status === 200, detail: `status=${res.status}` };
    },
  },
  {
    name: "pin check (400013)",
    run: async () => {
      const base = resolveBaseUrl();
      const { status, json } = await getJson(`${base}/api/shipping/pin-check?pin=400013&shippingClass=STANDARD`);
      const valid = isRecord(json) && isRecord(json.estimate) && json.estimate.valid === true;
      return { ok: status === 200 && valid, detail: `status=${status} valid=${valid}` };
    },
  },
  {
    name: "search suggestions",
    run: async () => {
      const base = resolveBaseUrl();
      const { status, json } = await getJson(`${base}/api/search/suggest?q=65W`);
      const suggestions = isRecord(json) && Array.isArray(json.suggestions)
        ? json.suggestions.length
        : "n/a";
      const ok = status === 200 && suggestions !== "n/a";
      return { ok, detail: `status=${status} suggestions=${suggestions}` };
    },
  },
];

async function main(): Promise<void> {
  const base = resolveBaseUrl();
  console.log(`POCKET THEORY live verify -> ${base}`);
  let failures = 0;
  for (const probe of probes) {
    try {
      const { ok, detail } = await probe.run();
      if (!ok) failures += 1;
      console.log(`  [${ok ? "PASS" : "FAIL"}] ${probe.name} - ${detail}`);
    } catch (err) {
      failures += 1;
      console.log(`  [FAIL] ${probe.name} - threw: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (failures > 0) {
    console.error(`\n${failures} probe(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll probes passed.");
  }
}

void main();
