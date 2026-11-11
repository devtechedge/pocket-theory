import { describe, expect, it } from "vitest";
import {
  evaluatePublicationGate,
  type ComplianceCandidate,
} from "@/domains/compliance/gate";
import {
  estimatePinDelivery,
  isValidIndianPin,
} from "@/domains/shipping/pin-service";

function buildValidDemoCandidate(
  overrides: Partial<ComplianceCandidate> = {},
): ComplianceCandidate {
  return {
    title: "PocketCell 10K 22.5W USB-C Power Bank",
    subtitle: "Compact daily backup with reversible USB-C.",
    description: "Matte polycarbonate power bank with illustrative demo specs.",
    pricePaise: 129900,
    mrpPaise: 179900,
    genericName: "Portable Lithium-Polymer Power Bank",
    modelNumber: "PT-PB10K-22",
    netQuantity: "1 N",
    countryOfOrigin: "India (illustrative demo declaration)",
    manufacturerDetails: "Pending OEM carton check",
    importerDetails: "Pocket Theory Consumer Devices, Mumbai",
    customerCareContact: "support@pockettheory.example | +91-22-4090-0100",
    warrantyMonths: 12,
    warrantyTerms: "12-month limited warranty.",
    requiresBisCrs: true,
    bisRegistrationNumber: null,
    requiresWpcEta: false,
    wpcEtaNumber: null,
    complianceStatus: "DEMO_ILLUSTRATIVE",
    requestedStatus: "ACTIVE",
    ...overrides,
  };
}

describe("Indian Statutory Compliance Publication Gate", () => {
  it("allows valid DEMO_ILLUSTRATIVE listings to publish in demoMode=true", () => {
    const res = evaluatePublicationGate(buildValidDemoCandidate(), {
      demoMode: true,
    });
    expect(res.allowedToPublish).toBe(true);
    expect(res.effectiveStatus).toBe("ACTIVE");
    expect(res.reasons).toHaveLength(0);
  });

  it("blocks DEMO_ILLUSTRATIVE listings lacking BIS/WPC references in commercial mode (demoMode=false)", () => {
    const res = evaluatePublicationGate(
      buildValidDemoCandidate({ requiresWpcEta: true }),
      { demoMode: false },
    );
    expect(res.allowedToPublish).toBe(false);
    expect(res.effectiveStatus).toBe("DRAFT");
    expect(res.reasons.join(" ")).toMatch(/BIS Compulsory Registration/);
    expect(res.reasons.join(" ")).toMatch(/WPC Equipment Type Approval/);
  });

  it("allows VERIFIED listings with real registration refs in commercial mode", () => {
    const res = evaluatePublicationGate(
      buildValidDemoCandidate({
        complianceStatus: "VERIFIED",
        requiresBisCrs: true,
        bisRegistrationNumber: "R-41000000",
        requiresWpcEta: true,
        wpcEtaNumber: "ETA-SD-20260101",
      }),
      { demoMode: false },
    );
    expect(res.allowedToPublish).toBe(true);
    expect(res.effectiveStatus).toBe("ACTIVE");
  });

  it("rejects prohibited marketing claims ('military-grade', 'waterproof', 'fastest', 'AI-powered') and fake cert strings", () => {
    const bad = evaluatePublicationGate(
      buildValidDemoCandidate({
        description:
          "World's fastest military-grade waterproof AI-powered charger with BIS R-87654321.",
      }),
      { demoMode: true },
    );
    expect(bad.allowedToPublish).toBe(false);
    expect(bad.effectiveStatus).toBe("DRAFT");
    expect(bad.reasons.length).toBeGreaterThanOrEqual(4);
  });

  it("blocks listings when MRP is lower than selling price or MISSING_EVIDENCE is set", () => {
    const res = evaluatePublicationGate(
      buildValidDemoCandidate({
        pricePaise: 199900,
        mrpPaise: 149900,
        complianceStatus: "MISSING_EVIDENCE",
      }),
      { demoMode: true },
    );
    expect(res.allowedToPublish).toBe(false);
    expect(res.reasons.join(" ")).toMatch(/MRP/);
    expect(res.reasons.join(" ")).toMatch(/MISSING_EVIDENCE/);
  });
});

describe("Indian 6-digit PIN delivery service", () => {
  it("validates 6-digit Indian PIN format", () => {
    expect(isValidIndianPin("400013")).toBe(true);
    expect(isValidIndianPin("000013")).toBe(false);
    expect(isValidIndianPin("40001")).toBe(false);
    expect(isValidIndianPin("56000A")).toBe(false);
  });

  it("estimates fast origin metro transit for Mumbai and surface routing for lithium outside MH", () => {
    const mumbai = estimatePinDelivery("400028", "STANDARD");
    expect(mumbai.valid).toBe(true);
    expect(mumbai.serviceable).toBe(true);
    expect(mumbai.stateCode).toBe("27");
    expect(mumbai.maxBusinessDays).toBeLessThanOrEqual(2);

    const bengaluruLithium = estimatePinDelivery("560001", "LITHIUM_SURFACE");
    expect(bengaluruLithium.serviceable).toBe(true);
    expect(bengaluruLithium.stateCode).toBe("29");
    expect(bengaluruLithium.routingMode).toBe("SURFACE_MANDATORY_LITHIUM");

    const andamanLithium = estimatePinDelivery("744101", "LITHIUM_SURFACE");
    expect(andamanLithium.valid).toBe(true);
    expect(andamanLithium.serviceable).toBe(false);
  });
});
