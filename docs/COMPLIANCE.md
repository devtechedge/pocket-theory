# India Electronics Regulatory, Packaging & E-Commerce Compliance Reference

**Last verified against official Indian sources:** 11 November 2026  
**Scope:** POCKET THEORY single-brand personal electronics and everyday gadgets storefront (India, INR, `Asia/Kolkata`).

> **Important Legal Disclaimer:** This document records engineering and operational research into applicable Indian statutory frameworks for personal electronics e-commerce. It is **not legal advice**. Every seeded SKU in POCKET THEORY is explicitly flagged as **illustrative demo data (`DEMO_ILLUSTRATIVE`)** pending qualified legal and laboratory verification of supplier test reports, BIS CRS R-numbers, WPC ETA certificates, CPCB EPR registrations, and physical box artwork before any live commercial sale.

---

## 1. Official Regulatory Frameworks & Primary Sources

### 1.1 Bureau of Indian Standards - Compulsory Registration Scheme (BIS CRS, Scheme-II)
- **Primary Sources:**
  - Ministry of Electronics and Information Technology (MeitY) / BIS CRS Product Schedule: <https://www.crsbis.in/BIS/products-bis.do> (accessed 11 Nov 2026)
  - BIS Scheme-II Registration Scheme & Notifications: <https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en> (accessed 11 Nov 2026)
  - Governing Order: *Electronics and Information Technology Goods (Requirement of Compulsory Registration) Order, 2021*, including **S.O. 4997(E) dated 04 November 2025** (migration from `IS 13252 (Part 1): 2010` and `IS 616: 2017` to `IS/IEC 62368 (Part 1): 2023` for Audio/Video, ICT Equipment safety) and **S.O. 1246(E) dated 10 March 2026** (2026 CRS amendments).
- **Applicability to POCKET THEORY Categories:**
  - **Power Banks (SKUs 01-05):** Covered under CRS **Sl. No. 21** (*Power Banks for use in portable applications*, `IS 13252 (Part 1): 2010` / migrating to `IS/IEC 62368-1:2023`), and internal lithium-ion/polymer cells/packs under **Sl. No. 30** (*Sealed Secondary Cells/Batteries - Part 2 Lithium Systems*, `IS 16046 (Part 2): 2018`).
  - **Wall Chargers & Power Adapters (SKUs 07-09, 40):** Covered under CRS **Sl. No. 26 / 27** (*Power Adaptors for Audio/Video & IT Equipment*, `IS 616` / `IS 13252 (Part 1)` / `IS/IEC 62368-1:2023`).
  - **Wireless Earbuds, Neckbands & Wireless Headphones (SKUs 13-17):** Covered under CRS **Sl. No. 56** (*Wireless Headphone and Earphone*, `IS 616: 2017` / `IS/IEC 62368-1:2023`).
  - **Bluetooth Speakers & Desktop Soundbars (SKUs 19-21):** Covered under CRS **Sl. No. 68 / 58** (*Bluetooth Speakers* / *Electronic Musical Systems <200W*, `IS 616: 2017` / `IS/IEC 62368-1:2023`).
  - **Smartwatches (SKU 22, and applicable wrist wearables SKU 23):** Covered under CRS **Sl. No. 44** (*Smart watches*, `IS 13252 (Part 1): 2010` / `IS/IEC 62368-1:2023`).
  - **Keyboards & Wireless Keyboards (SKUs 27, 29):** Covered under CRS **Sl. No. 15 & 52** (*Wireless Keyboards* / *Keyboard*, `IS 13252 (Part 1): 2010` / `IS/IEC 62368-1:2023`).
  - **Wireless Microphones (SKU 34):** Covered under CRS **Sl. No. 62** (*Wireless Microphone*, `IS 616: 2017` / `IS/IEC 62368-1:2023`).
  - **Dash Cameras / Video Recorders (SKU 37):** Subject to evaluation under CRS **Sl. No. 64** (*Video Camera*, `IS 616: 2017`) / **Sl. No. 41** depending on product classification.
  - **Passive Cables, Aluminium Stands, Passive Tripods (SKUs 10-12, 26, 33):** Not standalone mains/battery CRS categories, though internal E-Marker or bundled rechargeable remotes (if any) require component-level review.
- **Storefront Rule:** POCKET THEORY **never invents `R-XXXXXXXX` BIS registration numbers or BIS Standard Marks**. Each SKU stores `requiresBisCrs` (`boolean`), `bisStandardRef` (applicable IS standard for review), and `bisRegistrationNumber` (`null` in demo data, displayed as `"Pending supplier CRS R-number verification"`).

### 1.2 Wireless Planning & Coordination (WPC) Wing, DoT - Equipment Type Approval (ETA)
- **Primary Source:** Department of Telecommunications (DoT), Saral Sanchar / WPC Wing regulations on license-exempt de-licensed frequency bands (2.400 to 2.4835 GHz ISM band for Bluetooth / BLE / 2.4 GHz proprietary dongles, and short-range Inductive Qi wireless charging coils).
- **Applicability:** Every radio-transmitting SKU in our catalogue - wireless charging stands/banks (SKUs 04, 06), Bluetooth audio (SKUs 13-17, 19-21), smartwatches/bands/BLE trackers (SKUs 22-24), 2.4 GHz/BT keyboards & mice (SKUs 27-29), wireless lavalier mics (SKU 34), and Bluetooth FM receivers (SKU 39) - requires WPC ETA clearance (self-declaration or scrutinised ETA based on accredited RF test reports) prior to import or domestic sale.
- **Storefront Rule:** `requiresWpcEta` (`boolean`) and `wpcEtaNumber` (`null` in demo data) are tracked per SKU. No WPC ETA certificate number is fabricated.

### 1.3 Battery Waste Management Rules, 2022 & E-Waste (Management) Rules, 2022
- **Primary Sources:**
  - Central Pollution Control Board (CPCB) - *Battery Waste Management Rules, 2022* (notified by MoEFCC on 22 August 2022; updated portal notices 2025): <https://cpcb.nic.in/rules-5/> and <https://cpcb.gov.in/uploads/hwmd/Battery-WasteManagementRules-2022.pdf> (accessed 11 Nov 2026).
  - CPCB - *E-Waste (Management) Rules, 2022* (effective 1 April 2023, including Chapter V RoHS substance restrictions and Producer EPR registration on the CPCB portal): <https://cpcb.gov.in/rules-6/> (accessed 11 Nov 2026).
- **Obligations Reflected in Product & Safety Pages:**
  - Producers/importers placing portable batteries or listed electrical and electronic equipment (EEE) on the Indian market must hold CPCB Extended Producer Responsibility (EPR) registration and meet collection/recycling targets through registered recyclers.
  - **Zero landfill / incineration:** Waste lithium-ion cells, power banks, earbuds, and electronic accessories must never be discarded in household municipal bins or incinerated.
  - **Air transport safety:** Lithium-ion power banks (SKUs 01-05) carry explicit Watt-hour (`Wh`) cabin-baggage advisories (DGCA / IATA passenger rules forbid lithium power banks in checked-in hold baggage; units <= 100 Wh are cabin-carry only) and surface-shipping routing flags in the PIN delivery estimator.

### 1.4 Legal Metrology (Packaged Commodities) Rules, 2011 (including 2025-2026 E-Commerce Amendments)
- **Primary Source:** Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food and Public Distribution: <https://consumeraffairs.gov.in/pages/legal-metrology-act> (accessed 11 Nov 2026).
- **Mandatory E-Commerce Declarations (Rule 6 & Rule 6(10)):** Every product detail page in POCKET THEORY exposes a dedicated **Statutory & Packaging Information** table containing:
  1. **Common or Generic Name** of the commodity (e.g., `Portable Lithium-Ion Power Bank`, `True Wireless Stereo Earphones`).
  2. **Model Number** and internal `SKU`.
  3. **Net Quantity** in standard units (`1 N`, plus included accessory count in `Box Contents`).
  4. **Maximum Retail Price (MRP)** formatted in INR as **`₹X,XXX (Inclusive of all taxes)`**, enforced by a database check (`mrp_paise >= price_paise`).
  5. **Country of Origin** (explicitly stored per SKU and marked as illustrative demo metadata until batch import/manufacturing documentation is verified).
  6. **Name & Address of Manufacturer / Packer / Importer** (explicitly marked pending verified entity documentation in demo mode).
  7. **Month & Year of Manufacture / Packing / Import** (displayed as batch-dependent / pending physical carton verification in demo mode).
  8. **Customer Care Contact** (designation, postal address in Mumbai, Maharashtra, email, telephone hours).

### 1.5 Consumer Protection (E-Commerce) Rules, 2020
- **Primary Source:** Ministry of Consumer Affairs notification under the Consumer Protection Act, 2019.
- **Storefront Safeguards Implemented:**
  - **Named Grievance Officer & Nodal Contact** published on `/contact`, `/terms`, `/returns`, and `/product-safety` with the statutory **48-hour acknowledgement** and **30-day resolution** SLA commitment.
  - **Honest pricing & zero dark patterns:** No drip pricing, no pre-ticked paid add-ons, no fake countdown timers, no fabricated star ratings or fake buyer testimonials, and clear cancellation/return/replacement windows before payment.
  - **Return exclusions clearly disclosed upfront:** Physical/liquid damage, missing serial/box accessories, hygiene-sealed ear tips where applicable unless DOA/defective on arrival.

### 1.6 Goods and Services Tax (GST) Invoicing - CGST Act, 2017 (Rule 46)
- **Tax Structure Implemented:**
  - All storefront prices and MRPs are stored in **integer paise** (`1 INR = 100 paise`) and displayed **inclusive of GST** as required for Indian B2C retail.
  - Each SKU carries an illustrative **HSN classification** (for example `85076000` for Li-ion accumulators/power banks, `85044030` for static converters/chargers, `85444299` for insulated USB cables, `85183000` for headphones/earphones, `85182200` for loudspeakers, `85176290` for smartwatches/BLE devices, `85081100` for portable vacuum cleaners, `85258900` for dash cameras, `84148090` for tyre inflators) and **GST rate in basis points** (`1800` = 18%, verified per SKU by tax counsel before live billing).
  - **Server-side place-of-supply split:** Dispatch origin is modelled as **Maharashtra (State Code `27`)**.
    - **Intra-state delivery (`stateCode === '27'`):** GST is split equally into **9% CGST + 9% SGST** (with odd-paise remainder deterministic to 1 paisa so `taxableValuePaise + cgstPaise + sgstPaise === totalInclusivePaise`).
    - **Inter-state delivery (`stateCode !== '27'`):** Full **18% IGST** (`taxableValuePaise + igstPaise === totalInclusivePaise`).

---

## 2. Server-Enforced Publication Gate (`src/domains/compliance/gate.ts`)

POCKET THEORY enforces product compliance programmatically in TypeScript and PostgreSQL rather than relying on manual editorial discipline:

1. **Prohibited Unsubstantiated Claims Scanner:** Any product create/update payload containing banned superlatives or unverified safety promises (`"fastest"`, `"best in India"`, `"military-grade"`, `"waterproof"`, `"100% safe"`, `"AI-powered"`, medical/SpO2 diagnostic claims, or unverified `R-XXXXXXXX` / `ETA-SD-` strings when `complianceStatus !== 'VERIFIED'`) is rejected with structured validation errors.
2. **Mandatory Statutory Fields Check:** A SKU cannot transition to `status = 'ACTIVE'` if any Legal Metrology required field (`genericName`, `modelNumber`, `netQuantity`, `countryOfOrigin`, `mrpPaise >= pricePaise`, `warrantyMonths`, `customerCareRef`) is blank or invalid.
3. **Commercial vs Demo Mode Gate:**
   - In **Demo Mode (`DEMO_MODE=1`)**, the 40 house seed SKUs are permitted to publish under `complianceStatus = 'DEMO_ILLUSTRATIVE'`, which renders visible `"Illustrative Demo Spec - Pending Verification"` badges across PDP and comparison views. Any SKU marked `MISSING_EVIDENCE` or `REJECTED` stays unpublished (`DRAFT` / `ARCHIVED`) and is filtered out of all public storefront queries.
   - In **Live Commercial Mode (`DEMO_MODE=0`)**, `DEMO_ILLUSTRATIVE` is **not sufficient to publish**: `evaluatePublicationGate()` requires `complianceStatus === 'VERIFIED'` plus non-empty `bisRegistrationNumber` (when `requiresBisCrs` is true) and `wpcEtaNumber` (when `requiresWpcEta` is true).
