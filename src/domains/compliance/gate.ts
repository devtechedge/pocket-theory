import type { ComplianceStatus, ProductStatus } from "@/db/schema";

export interface ComplianceCandidate {
  title: string;
  subtitle: string;
  description: string;
  pricePaise: number;
  mrpPaise: number;
  genericName: string;
  modelNumber: string;
  netQuantity: string;
  countryOfOrigin: string;
  manufacturerDetails: string;
  importerDetails: string;
  customerCareContact: string;
  warrantyMonths: number;
  warrantyTerms: string;
  requiresBisCrs: boolean;
  bisRegistrationNumber?: string | null;
  requiresWpcEta: boolean;
  wpcEtaNumber?: string | null;
  complianceStatus: ComplianceStatus;
  requestedStatus: ProductStatus;
  specsText?: string[];
}

export interface PublicationGateResult {
  allowedToPublish: boolean;
  effectiveStatus: ProductStatus;
  reasons: string[];
}

const PROHIBITED_CLAIM_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  reason: string;
}> = [
  {
    pattern: /\bmilitary[- ]grade\b/i,
    reason: 'Prohibited unsubstantiated durability claim: "military-grade".',
  },
  {
    pattern: /\b100%\s*waterproof\b|\bwaterproof\b/i,
    reason:
      'Prohibited absolute ingress claim: "waterproof" (use specific splash/care guidance or verified lab IP rating only).',
  },
  {
    pattern: /\bworld'?s\s+fastest\b|\bfastest\s+charging\s+in\s+india\b|\bfastest\b/i,
    reason: 'Prohibited unsubstantiated superlative: "fastest".',
  },
  {
    pattern: /\b#?1\s+best\b|\bbest[- ]in[- ]class\b|\bbest\s+earbuds\b|\bbest\s+power\s*bank\b/i,
    reason: 'Prohibited unsubstantiated comparative claim: "best".',
  },
  {
    pattern: /\bai[- ]powered\b/i,
    reason: 'Prohibited vague marketing claim: "AI-powered".',
  },
  {
    pattern: /\bmedical[- ]grade\b|\bdiagnos(?:e|is|tic)\b|\bblood\s+pressure\s+monitor\b/i,
    reason:
      "Prohibited medical/diagnostic health promise on consumer electronics.",
  },
];

const UNVERIFIED_CERT_CLAIM_PATTERN =
  /\b(?:R-\d{7,9}|ETA-SD-\d{4,}|ISI\s+Certified|FCC\s+ID\s*:)\b/i;

/**
 * Evaluates whether a product listing satisfies Indian Legal Metrology,
 * BIS CRS, WPC ETA, and truth-in-advertising rules before becoming ACTIVE.
 */
export function evaluatePublicationGate(
  candidate: ComplianceCandidate,
  options: { demoMode: boolean },
): PublicationGateResult {
  const reasons: string[] = [];

  const combinedText = [
    candidate.title,
    candidate.subtitle,
    candidate.description,
    ...(candidate.specsText ?? []),
  ].join(" ");

  for (const rule of PROHIBITED_CLAIM_PATTERNS) {
    if (rule.pattern.test(combinedText)) {
      reasons.push(rule.reason);
    }
  }

  if (
    candidate.complianceStatus !== "VERIFIED" &&
    UNVERIFIED_CERT_CLAIM_PATTERN.test(combinedText)
  ) {
    reasons.push(
      "Cannot cite specific BIS R-numbers, WPC ETA numbers, or certification marks while complianceStatus is not VERIFIED.",
    );
  }

  // Legal Metrology (Packaged Commodities) Rules mandatory fields
  if (!candidate.genericName.trim()) {
    reasons.push("Missing Legal Metrology generic/common commodity name.");
  }
  if (!candidate.modelNumber.trim()) {
    reasons.push("Missing model number.");
  }
  if (!candidate.netQuantity.trim()) {
    reasons.push("Missing net quantity declaration (for example '1 N').");
  }
  if (!candidate.countryOfOrigin.trim()) {
    reasons.push("Missing country of origin declaration.");
  }
  if (!candidate.manufacturerDetails.trim()) {
    reasons.push("Missing manufacturer/packer details.");
  }
  if (!candidate.customerCareContact.trim()) {
    reasons.push("Missing customer care contact disclosure.");
  }
  if (
    !Number.isSafeInteger(candidate.pricePaise) ||
    candidate.pricePaise <= 0
  ) {
    reasons.push("Selling price must be a positive integer in paise.");
  }
  if (
    !Number.isSafeInteger(candidate.mrpPaise) ||
    candidate.mrpPaise < candidate.pricePaise
  ) {
    reasons.push(
      "MRP (inclusive of all taxes) must be an integer >= selling price.",
    );
  }
  if (candidate.warrantyMonths < 0 || !candidate.warrantyTerms.trim()) {
    reasons.push("Missing warranty period or warranty terms disclosure.");
  }

  // Compliance lifecycle state enforcement
  if (
    candidate.complianceStatus === "MISSING_EVIDENCE" ||
    candidate.complianceStatus === "REJECTED"
  ) {
    reasons.push(
      `Listing cannot be published while compliance status is ${candidate.complianceStatus}.`,
    );
  }

  if (!options.demoMode) {
    if (candidate.complianceStatus !== "VERIFIED") {
      reasons.push(
        `Commercial mode requires complianceStatus = VERIFIED (received ${candidate.complianceStatus}).`,
      );
    }
    if (candidate.requiresBisCrs && !candidate.bisRegistrationNumber?.trim()) {
      reasons.push(
        "BIS Compulsory Registration Scheme (CRS) R-number is required before live commercial publication.",
      );
    }
    if (candidate.requiresWpcEta && !candidate.wpcEtaNumber?.trim()) {
      reasons.push(
        "WPC Equipment Type Approval (ETA) certificate reference is required for wireless/RF equipment before live commercial publication.",
      );
    }
  } else {
    // Even in DEMO_MODE, PENDING_REVIEW stays unpublished until explicitly marked DEMO_ILLUSTRATIVE or VERIFIED
    if (
      candidate.complianceStatus !== "DEMO_ILLUSTRATIVE" &&
      candidate.complianceStatus !== "VERIFIED"
    ) {
      reasons.push(
        `Demo mode allows publishing only DEMO_ILLUSTRATIVE or VERIFIED listings (received ${candidate.complianceStatus}).`,
      );
    }
  }

  if (candidate.requestedStatus !== "ACTIVE") {
    return {
      allowedToPublish: reasons.length === 0,
      effectiveStatus: candidate.requestedStatus,
      reasons,
    };
  }

  if (reasons.length > 0) {
    return {
      allowedToPublish: false,
      effectiveStatus: "DRAFT",
      reasons,
    };
  }

  return {
    allowedToPublish: true,
    effectiveStatus: "ACTIVE",
    reasons: [],
  };
}

export function isProductPubliclyVisible(
  product: { status: ProductStatus; complianceStatus: ComplianceStatus },
  options: { demoMode: boolean },
): boolean {
  if (product.status !== "ACTIVE") return false;
  if (options.demoMode) {
    return (
      product.complianceStatus === "DEMO_ILLUSTRATIVE" ||
      product.complianceStatus === "VERIFIED"
    );
  }
  return product.complianceStatus === "VERIFIED";
}
