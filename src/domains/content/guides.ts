export interface BuyingGuide {
  slug: string;
  tag: string;
  title: string;
  summary: string;
  readingMinutes: number;
  updatedDate: string;
  sections: ReadonlyArray<{
    heading: string;
    paragraphs: readonly string[];
  }>;
  sources: ReadonlyArray<{
    label: string;
    url: string;
  }>;
  relatedSlugs: readonly string[];
}

export const BUYING_GUIDES: readonly BuyingGuide[] = [
  {
    slug: "power-bank-capacity-explained",
    tag: "POWER MATH",
    title: "Power-Bank Capacity Explained: Why 10,000 mAh Never Equals Two 5,000 mAh Phone Charges",
    summary:
      "Understanding 3.7V lithium cell voltage vs 5V/9V USB output conversion, Watt-hour (Wh) flight caps, and BIS IS 13252-1 / IS 16046-2 labels.",
    readingMinutes: 4,
    updatedDate: "11 November 2026",
    sections: [
      {
        heading: "1. Cell Voltage (3.7V) vs USB Output Voltage (5V / 9V)",
        paragraphs: [
          "Manufacturers print the nominal mAh of the internal lithium-ion or lithium-polymer cells at ~3.7V (so a 10,000 mAh pack holds roughly 37 Wh of chemical energy). Your phone's USB-C port, however, negotiates 5V or 9V.",
          "Stepping 3.7V up to 5V reduces theoretical mAh to 7,400 mAh before accounting for DC-DC boost converter inefficiency and cable resistance (~12-18%). In real life, a healthy 10,000 mAh pack delivers roughly 6,000 to 6,500 mAh to your handset - about 1.2x charges on a 5,000 mAh phone.",
        ],
      },
      {
        heading: "2. Domestic & International Flight Cabin Rules (Wh, Not mAh)",
        paragraphs: [
          "Aviation regulators (DGCA / IATA Dangerous Goods Regulations) measure lithium spares in Watt-hours: Wh = (mAh x V) / 1000. Packs up to 100 Wh (approx. 27,000 mAh at 3.7V) are generally permitted in carry-on cabin baggage only and strictly prohibited in checked-in hold luggage.",
        ],
      },
      {
        heading: "3. Indian Statutory Checks Before Buying",
        paragraphs: [
          "In India, portable power banks fall under the MeitY / BIS Compulsory Registration Scheme (CRS Sl. No. 21, IS 13252 Part 1 / migrating to IS/IEC 62368-1) and lithium cells under IS 16046 Part 2. Always verify physical carton markings rather than relying on unverified marketplace banners.",
        ],
      },
    ],
    sources: [
      {
        label: "BIS Compulsory Registration Scheme (CRS) Product List",
        url: "https://www.crsbis.in/BIS/products-bis.do",
      },
      {
        label: "CPCB Battery Waste Management Rules, 2022",
        url: "https://cpcb.nic.in/rules-5/",
      },
    ],
    relatedSlugs: [
      "pocketcell-10k-22-5w-usb-c-power-bank",
      "pocketcell-20k-22-5w-dual-output-power-bank",
      "pocketcell-pro-20k-65w-laptop-power-bank",
    ],
  },
  {
    slug: "usb-c-power-delivery-and-gan",
    tag: "USB-C PD & GAN",
    title: "USB-C Power Delivery, PPS, GaN Chargers & When You Need an E-Marked Cable",
    summary:
      "How gallium nitride shrinks laptop adapters, why multi-port chargers briefly pause on plug-in, and the difference between 3A (60W), 5A (100W), and EPR (240W) cables.",
    readingMinutes: 5,
    updatedDate: "11 November 2026",
    sections: [
      {
        heading: "1. What GaN Changes (and What It Does Not)",
        paragraphs: [
          "Gallium Nitride (GaN) switching transistors switch faster with lower conduction losses than older silicon MOSFETs, letting engineers shrink transformer magnetics inside 33W and 65W wall bricks. A compact GaN brick still dissipates several watts of heat across a smaller surface area, so warm touch temperatures under full laptop load are expected physics, not a fault.",
        ],
      },
      {
        heading: "2. 60W vs 100W vs 240W USB-C Cables",
        paragraphs: [
          "Standard un-chipped USB-C cables are capped at 3 Amps (up to 60W at 20V). Above 3 Amps (100W at 20V/5A, or up to 240W at 48V/5A under USB PD 3.1 Extended Power Range), the USB-IF specification requires an electronic marker (E-Marker) chip inside the connector shell so the charger confirms wire gauge safety before raising current.",
        ],
      },
    ],
    sources: [
      {
        label: "USB Implementers Forum - USB Power Delivery Overview",
        url: "https://www.usb.org/usb-charger-pd",
      },
      {
        label: "BIS Scheme-II Registration Scheme (IS/IEC 62368-1 Migration)",
        url: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en",
      },
    ],
    relatedSlugs: [
      "voltcore-65w-dual-port-gan-wall-charger",
      "armorcord-240w-e-marked-usb-c-cable",
      "flexcord-100w-braided-usb-c-cable-2m",
    ],
  },
  {
    slug: "anc-vs-enc-audio-guide",
    tag: "ACOUSTICS",
    title: "ANC vs ENC: Active Noise Cancellation for Your Ears vs Call Clarity for Your Mic",
    summary:
      "Why 'Quad-Mic ENC' earbuds will not silence a noisy metro coach for you, and what hybrid ANC actually cancels.",
    readingMinutes: 4,
    updatedDate: "11 November 2026",
    sections: [
      {
        heading: "1. ANC Protects the Listener",
        paragraphs: [
          "Active Noise Cancellation (ANC) uses outward- and inward-facing microphones plus anti-phase acoustic waves inside your ear canal to attenuate steady low-frequency rumble - ceiling fans, AC compressors, train rails, and aircraft engines. Sudden sharp sounds (car horns, claps) rely mostly on the physical passive seal of your silicone ear tips or over-ear cushions.",
        ],
      },
      {
        heading: "2. ENC Protects the Person on the Other End of Your Call",
        paragraphs: [
          "Environmental Noise Cancellation (ENC) runs digital signal processing on your outbound voice microphone stream so the caller hears less traffic wind. An 'ENC-only' earbud offers zero active noise reduction when you listen to music.",
        ],
      },
    ],
    sources: [
      {
        label: "IDC Wearable Devices Market Insights (Hearables Trends)",
        url: "https://www.idc.com/promo/wearablevendor/",
      },
    ],
    relatedSlugs: [
      "airbeat-pro-anc-true-wireless-earbuds",
      "studiopulse-anc-over-ear-wireless-headphones",
      "cleartone-usb-c-wired-earphones",
    ],
  },
  {
    slug: "earbuds-fit-in-ear-vs-open-ear",
    tag: "ERGONOMICS",
    title: "Choosing Earwear Fit: Sealed In-Ear TWS vs Open-Ear Hooks vs Neckbands vs Wired USB-C",
    summary:
      "Matching acoustic form factors to sweaty outdoor runs, long office calls, and helmet commutes.",
    readingMinutes: 4,
    updatedDate: "11 November 2026",
    sections: [
      {
        heading: "1. Sealed In-Ear vs Open-Ear (OWS)",
        paragraphs: [
          "Silicone-tip TWS buds deliver strong sub-bass and enable ANC, but some ears experience pressure fatigue after two hours. Open-ear ear-hook designs rest outside the ear canal so runners stay aware of vehicles and cyclists without ear-tip occlusion.",
        ],
      },
      {
        heading: "2. When Neckbands and USB-C Wired Still Win",
        paragraphs: [
          "Neckbands eliminate dropped-bud anxiety and house larger batteries with tactile physical buttons. USB-C wired earphones with built-in DACs need zero battery charging and deliver uncompressed call microphone reliability on laptops and phones.",
        ],
      },
    ],
    sources: [
      {
        label: "Counterpoint Research - India TWS Market Tracker",
        url: "https://counterpointresearch.com/en/reports/India-tws-shipments-by-model-tracker-Q2-2026",
      },
    ],
    relatedSlugs: [
      "airbeat-open-ear-sport-earbuds",
      "flowband-wireless-bluetooth-neckband",
      "cleartone-usb-c-wired-earphones",
    ],
  },
  {
    slug: "dashcam-buying-guide-india",
    tag: "AUTOMOTIVE",
    title: "Dashcams for Indian Roads: Why Supercapacitors Beat Lithium Batteries on Hot Windshields",
    summary:
      "Cabin heat resilience at 50+ C, dual-channel rear coverage, electrostatic windshield films, and High-Endurance microSD cards.",
    readingMinutes: 4,
    updatedDate: "11 November 2026",
    sections: [
      {
        heading: "1. Thermal Safety on Sun-Baked Windshields",
        paragraphs: [
          "A car parked outdoors in Delhi, Nagpur, or Chennai in April-June easily sees windshield glass temperatures past 60 C. Dashcams built with internal pouch lithium batteries risk swelling over time; supercapacitor-backed dashcams store just enough charge to finalize and close the active MP4 clip safely when ignition cuts off.",
        ],
      },
      {
        heading: "2. Never Skimp on the microSD Card",
        paragraphs: [
          "Continuous 1080p/2K loop recording rewrites every sector of a memory card hundreds of times. Always pair a dashcam with a card explicitly rated 'High Endurance' (U3 / V30) and format it inside the camera every 60 days.",
        ],
      },
    ],
    sources: [
      {
        label: "BIS CRS Video & Electronic Apparatus Standards",
        url: "https://www.crsbis.in/BIS/products-bis.do",
      },
    ],
    relatedSlugs: [
      "roadview-dual-channel-dash-camera",
      "roadcharge-45w-dual-port-usb-c-car-charger",
      "airpump-compact-digital-tyre-inflator",
    ],
  },
  {
    slug: "mini-vacuums-and-tyre-inflators",
    tag: "UTILITY GEAR",
    title: "Mini Vacuums, Cordless Air Dusters & Portable Tyre Inflators: Corded 12V vs Rechargeable",
    summary:
      "Choosing brushless air blowers for keyboards, capsule desk vacuums, and why trunk-stored car vacuums should skip batteries.",
    readingMinutes: 4,
    updatedDate: "11 November 2026",
    sections: [
      {
        heading: "1. Blowing vs Vacuuming Dust on Electronics",
        paragraphs: [
          "Tiny vacuum nozzles lack the static pressure to pull dust matted under mechanical keyboard switches or heatsink fins; focused air blowers dislodge dust first, while mini capsule vacuums excel at picking up loose desk crumbs and coffee grinds.",
        ],
      },
      {
        heading: "2. Car Boot Storage Rule: Corded 12V Wins in Summer",
        paragraphs: [
          "For dedicated glovebox or boot storage, a 12V corded car vacuum avoids leaving lithium cells in hot parked cabins, whereas dual-power digital tyre inflators (rechargeable + 12V backup cord) should travel in your cabin bag and rest after 8-10 minutes of continuous compression.",
        ],
      },
    ],
    sources: [
      {
        label: "CPCB E-Waste (Management) Rules, 2022",
        url: "https://cpcb.gov.in/rules-6/",
      },
    ],
    relatedSlugs: [
      "airduster-mini-cordless-vacuum-and-blower",
      "carclean-12v-compact-car-vacuum",
      "airpump-compact-digital-tyre-inflator",
    ],
  },
];

export function getGuideBySlug(slug: string): BuyingGuide | undefined {
  return BUYING_GUIDES.find((g) => g.slug === slug);
}
