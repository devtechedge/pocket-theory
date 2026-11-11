import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  PACKSHOT_SPECS,
  type PackshotSpec,
} from "../src/domains/catalog/packshot-specs";

function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function renderDeviceArtwork(spec: PackshotSpec): string {
  const { silhouette, primaryFinish, secondaryFinish, accentHex } = spec;

  switch (silhouette) {
    case "powerbank_10k":
    case "powerbank_20k": {
      const tall = silhouette === "powerbank_20k" ? 310 : 265;
      const y0 = Math.round((560 - tall) / 2);
      return `
        <rect x="275" y="${y0}" width="250" height="${tall}" rx="28" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="2.5"/>
        <rect x="292" y="${y0 + 18}" width="216" height="${tall - 36}" rx="18" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="1.2"/>
        <circle cx="322" cy="${y0 + 44}" r="4.5" fill="${accentHex}"/>
        <circle cx="338" cy="${y0 + 44}" r="4.5" fill="#EDF1F7"/>
        <circle cx="354" cy="${y0 + 44}" r="4.5" fill="#EDF1F7"/>
        <circle cx="370" cy="${y0 + 44}" r="4.5" fill="#EDF1F7" fill-opacity="0.35"/>
        <rect x="366" y="${y0 - 4}" width="32" height="7" rx="3" fill="${accentHex}"/>
        <rect x="412" y="${y0 - 4}" width="38" height="7" rx="2" fill="#8D98A8"/>
        <text x="315" y="${y0 + tall - 42}" font-family="monospace" font-size="15" font-weight="700" fill="#EDF1F7" fill-opacity="0.82">${silhouette === "powerbank_20k" ? "20K / 22.5W" : "10K / 22.5W"}</text>
      `;
    }
    case "powerbank_laptop":
      return `
        <rect x="260" y="135" width="280" height="300" rx="24" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="3"/>
        <rect x="290" y="165" width="220" height="92" rx="12" fill="#0B0E13" stroke="#39465A" stroke-width="1.5"/>
        <text x="316" y="218" font-family="monospace" font-size="34" font-weight="700" fill="#84ADFF">65W</text>
        <text x="415" y="204" font-family="monospace" font-size="13" fill="#A6B2C2">PD OUT</text>
        <text x="415" y="226" font-family="monospace" font-size="14" font-weight="700" fill="#FF6B2B">88%</text>
        <rect x="340" y="131" width="34" height="7" rx="3" fill="${accentHex}"/>
        <rect x="386" y="131" width="34" height="7" rx="3" fill="${accentHex}"/>
        <rect x="432" y="131" width="40" height="7" rx="2" fill="#98A4B5"/>
        <line x1="290" y1="365" x2="510" y2="365" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5"/>
        <text x="290" y="396" font-family="monospace" font-size="14" font-weight="700" fill="#EDF1F7">POCKETCELL PRO // 20,000 mAh</text>
      `;
    case "powerbank_mag":
      return `
        <rect x="282" y="145" width="236" height="280" rx="30" fill="url(#bodyGrad)" stroke="#9AA6B8" stroke-width="2.5"/>
        <circle cx="400" cy="262" r="68" fill="none" stroke="${accentHex}" stroke-width="5"/>
        <circle cx="400" cy="262" r="54" fill="none" stroke="#1E242D" stroke-opacity="0.22" stroke-width="1.5" stroke-dasharray="5 5"/>
        <rect x="394" y="346" width="12" height="44" rx="6" fill="${accentHex}"/>
        <line x1="322" y1="396" x2="478" y2="396" stroke="#1E242D" stroke-opacity="0.28" stroke-width="2"/>
      `;
    case "powerbank_slim":
      return `
        <rect x="296" y="150" width="208" height="270" rx="20" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="2"/>
        <rect x="514" y="162" width="18" height="246" rx="8" fill="${secondaryFinish}"/>
        <circle cx="523" cy="210" r="3.5" fill="${accentHex}"/>
        <text x="322" y="388" font-family="monospace" font-size="14" font-weight="700" fill="#EDF1F7">9.2 MM ULTRA-SLIM</text>
      `;
    case "charging_stand_3in1":
      return `
        <ellipse cx="400" cy="420" rx="145" ry="26" fill="${primaryFinish}" stroke="#394454" stroke-width="2.5"/>
        <rect x="390" y="210" width="20" height="205" rx="8" fill="${secondaryFinish}"/>
        <rect x="322" y="232" width="156" height="22" rx="10" fill="${secondaryFinish}"/>
        <ellipse cx="400" cy="198" rx="66" ry="52" fill="${primaryFinish}" stroke="${accentHex}" stroke-width="4"/>
        <circle cx="492" cy="243" r="24" fill="${primaryFinish}" stroke="#8D98A8" stroke-width="2.5"/>
        <circle cx="348" cy="418" r="4" fill="${accentHex}"/>
      `;
    case "gan_charger_65w":
    case "gan_charger_33w":
    case "gan_charger_20w": {
      const w =
        silhouette === "gan_charger_65w"
          ? 210
          : silhouette === "gan_charger_33w"
            ? 184
            : 160;
      const h =
        silhouette === "gan_charger_65w"
          ? 220
          : silhouette === "gan_charger_33w"
            ? 188
            : 162;
      const x = Math.round(400 - w / 2);
      const y = Math.round(255 - h / 2);
      const darkText = silhouette !== "gan_charger_65w";
      return `
        <rect x="${x + 48}" y="${y + h - 4}" width="16" height="68" rx="8" fill="#8B96A7"/>
        <rect x="${x + w - 64}" y="${y + h - 4}" width="16" height="68" rx="8" fill="#8B96A7"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="2.5"/>
        <rect x="${x + Math.round(w / 2) - 22}" y="${y + 40}" width="44" height="14" rx="7" fill="#111418" stroke="${accentHex}" stroke-width="2"/>
        ${
          silhouette !== "gan_charger_20w"
            ? `<rect x="${x + Math.round(w / 2) - 24}" y="${y + 72}" width="48" height="16" rx="4" fill="#111418" stroke="#6B778A" stroke-width="2"/>`
            : ""
        }
        <text x="${x + 24}" y="${y + h - 26}" font-family="monospace" font-size="16" font-weight="700" fill="${darkText ? "#111418" : "#EDF1F7"}">${
          silhouette === "gan_charger_65w"
            ? "GaN 65W"
            : silhouette === "gan_charger_33w"
              ? "33W DUAL"
              : "20W PD"
        }</text>
      `;
    }
    case "cable_braided":
    case "cable_emark":
      return `
        <ellipse cx="400" cy="285" rx="145" ry="118" fill="none" stroke="${primaryFinish}" stroke-width="20"/>
        <ellipse cx="400" cy="285" rx="145" ry="118" fill="none" stroke="#8C98AA" stroke-opacity="0.35" stroke-width="16" stroke-dasharray="5 7"/>
        <rect x="292" y="138" width="54" height="28" rx="6" fill="${secondaryFinish}" stroke="${accentHex}" stroke-width="2"/>
        <rect x="268" y="144" width="24" height="16" rx="3" fill="#B8C2D1"/>
        <rect x="454" y="396" width="54" height="28" rx="6" fill="${secondaryFinish}" stroke="${accentHex}" stroke-width="2"/>
        <rect x="508" y="402" width="24" height="16" rx="3" fill="#B8C2D1"/>
        <rect x="386" y="152" width="28" height="36" rx="5" fill="${accentHex}"/>
      `;
    case "cable_retract":
      return `
        <line x1="175" y1="285" x2="625" y2="285" stroke="#1E242D" stroke-width="10" stroke-linecap="round"/>
        <circle cx="400" cy="285" r="88" fill="url(#bodyGrad)" stroke="#1E242D" stroke-width="3"/>
        <circle cx="400" cy="285" r="54" fill="#1E242D"/>
        <circle cx="400" cy="285" r="16" fill="${accentHex}"/>
        <rect x="148" y="271" width="36" height="28" rx="5" fill="#1E242D"/>
        <rect x="614" y="252" width="36" height="22" rx="4" fill="#1E242D"/>
        <rect x="614" y="280" width="36" height="22" rx="4" fill="${accentHex}"/>
        <rect x="614" y="308" width="36" height="22" rx="4" fill="#323C4B"/>
      `;
    case "tws_anc":
    case "tws_gaming":
      return `
        <rect x="255" y="235" width="290" height="190" rx="${silhouette === "tws_gaming" ? "26" : "80"}" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="3"/>
        <line x1="262" y1="312" x2="538" y2="312" stroke="${accentHex}" stroke-width="3"/>
        <rect x="315" y="145" width="56" height="108" rx="28" fill="${primaryFinish}" stroke="#6E7B8F" stroke-width="2"/>
        <rect x="334" y="210" width="18" height="58" rx="9" fill="${secondaryFinish}"/>
        <rect x="429" y="145" width="56" height="108" rx="28" fill="${primaryFinish}" stroke="#6E7B8F" stroke-width="2"/>
        <rect x="448" y="210" width="18" height="58" rx="9" fill="${secondaryFinish}"/>
        <circle cx="400" cy="356" r="6" fill="${accentHex}"/>
      `;
    case "tws_open":
      return `
        <path d="M270 290 C250 190, 365 170, 380 250" fill="none" stroke="${secondaryFinish}" stroke-width="18" stroke-linecap="round"/>
        <ellipse cx="352" cy="282" rx="44" ry="28" fill="url(#bodyGrad)" stroke="#1E242D" stroke-width="2.5"/>
        <path d="M530 290 C550 190, 435 170, 420 250" fill="none" stroke="${secondaryFinish}" stroke-width="18" stroke-linecap="round"/>
        <ellipse cx="448" cy="282" rx="44" ry="28" fill="url(#bodyGrad)" stroke="#1E242D" stroke-width="2.5"/>
        <circle cx="352" cy="282" r="7" fill="${accentHex}"/>
        <circle cx="448" cy="282" r="7" fill="${accentHex}"/>
        <rect x="285" y="355" width="230" height="74" rx="36" fill="${secondaryFinish}"/>
      `;
    case "neckband":
      return `
        <path d="M250 350 C225 160, 575 160, 550 350" fill="none" stroke="${primaryFinish}" stroke-width="20" stroke-linecap="round"/>
        <rect x="236" y="325" width="28" height="74" rx="12" fill="${secondaryFinish}" stroke="${accentHex}" stroke-width="2"/>
        <rect x="536" y="325" width="28" height="74" rx="12" fill="${secondaryFinish}"/>
        <circle cx="355" cy="408" r="20" fill="${primaryFinish}" stroke="${accentHex}" stroke-width="2.5"/>
        <circle cx="445" cy="408" r="20" fill="${primaryFinish}" stroke="${accentHex}" stroke-width="2.5"/>
        <path d="M250 398 Q300 430 336 410" fill="none" stroke="${primaryFinish}" stroke-width="4"/>
        <path d="M550 398 Q500 430 464 410" fill="none" stroke="${primaryFinish}" stroke-width="4"/>
      `;
    case "headphones_anc":
      return `
        <path d="M265 300 A135 135 0 0 1 535 300" fill="none" stroke="${primaryFinish}" stroke-width="22" stroke-linecap="round"/>
        <path d="M282 295 A118 118 0 0 1 518 295" fill="none" stroke="${secondaryFinish}" stroke-width="6"/>
        <rect x="238" y="278" width="66" height="122" rx="32" fill="url(#bodyGrad)" stroke="${accentHex}" stroke-width="2.5"/>
        <rect x="496" y="278" width="66" height="122" rx="32" fill="url(#bodyGrad)" stroke="${accentHex}" stroke-width="2.5"/>
        <rect x="286" y="292" width="20" height="94" rx="10" fill="#384252"/>
        <rect x="494" y="292" width="20" height="94" rx="10" fill="#384252"/>
      `;
    case "wired_usb_c":
      return `
        <path d="M310 215 Q310 340 400 340 Q490 340 490 215" fill="none" stroke="#222832" stroke-width="5"/>
        <line x1="400" y1="340" x2="400" y2="418" stroke="#222832" stroke-width="6"/>
        <circle cx="310" cy="198" r="26" fill="url(#bodyGrad)" stroke="#222832" stroke-width="2.5"/>
        <circle cx="490" cy="198" r="26" fill="url(#bodyGrad)" stroke="#222832" stroke-width="2.5"/>
        <rect x="386" y="362" width="28" height="44" rx="8" fill="#222832" stroke="${accentHex}" stroke-width="2"/>
        <rect x="384" y="418" width="32" height="24" rx="5" fill="${accentHex}"/>
        <rect x="392" y="442" width="16" height="14" rx="2" fill="#9AA6B8"/>
      `;
    case "speaker_compact":
      return `
        <rect x="255" y="195" width="270" height="185" rx="56" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="3"/>
        <path d="M525 262 Q585 262 575 312 Q565 342 525 322" fill="none" stroke="${accentHex}" stroke-width="10" stroke-linecap="round"/>
        <circle cx="345" cy="288" r="46" fill="#14181F" stroke="#455164" stroke-width="2"/>
        <circle cx="450" cy="288" r="34" fill="#14181F" stroke="${accentHex}" stroke-width="2"/>
      `;
    case "speaker_party":
      return `
        <path d="M285 195 L315 152 L485 152 L515 195" fill="none" stroke="${secondaryFinish}" stroke-width="14" stroke-linejoin="round"/>
        <rect x="215" y="195" width="370" height="190" rx="48" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="3"/>
        <circle cx="322" cy="290" r="56" fill="#0F1318" stroke="${accentHex}" stroke-width="4"/>
        <circle cx="478" cy="290" r="56" fill="#0F1318" stroke="${accentHex}" stroke-width="4"/>
        <circle cx="322" cy="290" r="20" fill="#27303D"/>
        <circle cx="478" cy="290" r="20" fill="#27303D"/>
      `;
    case "soundbar_desk":
      return `
        <rect x="155" y="238" width="490" height="96" rx="20" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="2.5"/>
        <rect x="175" y="254" width="390" height="64" rx="10" fill="#11151B" stroke="#344052" stroke-width="1.5"/>
        <circle cx="604" cy="286" r="24" fill="${secondaryFinish}" stroke="${accentHex}" stroke-width="3"/>
        <line x1="604" y1="286" x2="618" y2="274" stroke="#111418" stroke-width="3" stroke-linecap="round"/>
        <rect x="215" y="334" width="44" height="12" rx="4" fill="#3B4657"/>
        <rect x="541" y="334" width="44" height="12" rx="4" fill="#3B4657"/>
      `;
    case "smartwatch":
      return `
        <rect x="346" y="110" width="108" height="95" rx="18" fill="${secondaryFinish}"/>
        <rect x="346" y="365" width="108" height="95" rx="18" fill="${secondaryFinish}"/>
        <rect x="302" y="185" width="196" height="205" rx="42" fill="url(#bodyGrad)" stroke="#6B788C" stroke-width="3"/>
        <rect x="318" y="201" width="164" height="173" rx="30" fill="#0A0D12"/>
        <rect x="498" y="236" width="12" height="36" rx="5" fill="${accentHex}"/>
        <text x="342" y="276" font-family="monospace" font-size="38" font-weight="700" fill="#EDF1F7">10:08</text>
        <text x="344" y="308" font-family="monospace" font-size="13" fill="${accentHex}">BT CALL READY</text>
        <rect x="344" y="324" width="112" height="8" rx="4" fill="#232D3B"/>
        <rect x="344" y="324" width="78" height="8" rx="4" fill="#84ADFF"/>
      `;
    case "fitness_band":
      return `
        <rect x="364" y="105" width="72" height="360" rx="34" fill="${secondaryFinish}"/>
        <rect x="348" y="178" width="104" height="214" rx="48" fill="url(#bodyGrad)" stroke="#707E94" stroke-width="2.5"/>
        <rect x="362" y="196" width="76" height="178" rx="36" fill="#0B0F15"/>
        <text x="376" y="266" font-family="monospace" font-size="24" font-weight="700" fill="#EDF1F7">09</text>
        <text x="376" y="294" font-family="monospace" font-size="24" font-weight="700" fill="${accentHex}">42</text>
        <circle cx="400" cy="336" r="12" fill="none" stroke="${accentHex}" stroke-width="3"/>
      `;
    case "item_tracker":
      return `
        <circle cx="400" cy="148" r="28" fill="none" stroke="#6B778A" stroke-width="8"/>
        <circle cx="400" cy="300" r="118" fill="url(#bodyGrad)" stroke="#1E242D" stroke-width="3"/>
        <circle cx="400" cy="212" r="14" fill="#EEF1F5" stroke="#1E242D" stroke-width="2.5"/>
        <circle cx="400" cy="312" r="46" fill="#1E242D"/>
        <circle cx="400" cy="312" r="14" fill="${accentHex}"/>
      `;
    case "usbc_hub":
      return `
        <path d="M210 285 Q150 285 150 225 L150 195" fill="none" stroke="#232A34" stroke-width="10" stroke-linecap="round"/>
        <rect x="134" y="168" width="32" height="30" rx="5" fill="#232A34" stroke="${accentHex}" stroke-width="2"/>
        <rect x="210" y="232" width="390" height="106" rx="18" fill="url(#bodyGrad)" stroke="#7E8B9E" stroke-width="2.5"/>
        <rect x="242" y="274" width="46" height="18" rx="3" fill="#232A34"/>
        <rect x="308" y="274" width="36" height="18" rx="4" fill="#232A34"/>
        <rect x="364" y="274" width="36" height="18" rx="4" fill="#232A34"/>
        <rect x="420" y="277" width="30" height="12" rx="6" fill="${accentHex}"/>
        <rect x="470" y="279" width="52" height="8" rx="3" fill="#232A34"/>
        <rect x="538" y="272" width="34" height="24" rx="3" fill="#232A34"/>
      `;
    case "laptop_stand":
      return `
        <polygon points="210,395 585,395 555,412 195,412" fill="${secondaryFinish}"/>
        <line x1="230" y1="395" x2="545" y2="195" stroke="url(#bodyGrad)" stroke-width="18" stroke-linecap="round"/>
        <line x1="340" y1="395" x2="455" y2="252" stroke="${secondaryFinish}" stroke-width="12" stroke-linecap="round"/>
        <rect x="212" y="366" width="26" height="32" rx="6" fill="${accentHex}"/>
      `;
    case "kb_mouse_combo":
      return `
        <rect x="155" y="210" width="355" height="150" rx="14" fill="url(#bodyGrad)" stroke="#445063" stroke-width="2.5"/>
        <g fill="#D7DFE9">
          <rect x="174" y="230" width="316" height="20" rx="4"/>
          <rect x="174" y="258" width="316" height="22" rx="4"/>
          <rect x="174" y="288" width="316" height="22" rx="4"/>
          <rect x="174" y="318" width="90" height="22" rx="4"/>
          <rect x="272" y="318" width="130" height="22" rx="4" fill="${accentHex}"/>
          <rect x="410" y="318" width="80" height="22" rx="4"/>
        </g>
        <rect x="545" y="232" width="92" height="138" rx="44" fill="url(#bodyGrad)" stroke="#445063" stroke-width="2.5"/>
        <rect x="586" y="252" width="10" height="28" rx="5" fill="${accentHex}"/>
      `;
    case "silent_mouse":
      return `
        <rect x="312" y="148" width="176" height="276" rx="86" fill="url(#bodyGrad)" stroke="#252C37" stroke-width="3"/>
        <line x1="322" y1="252" x2="478" y2="252" stroke="#252C37" stroke-opacity="0.25" stroke-width="2"/>
        <line x1="400" y1="152" x2="400" y2="252" stroke="#252C37" stroke-opacity="0.25" stroke-width="2"/>
        <rect x="390" y="182" width="20" height="48" rx="10" fill="${accentHex}"/>
      `;
    case "mech_keyboard":
      return `
        <rect x="170" y="195" width="460" height="186" rx="16" fill="url(#bodyGrad)" stroke="#4A566B" stroke-width="3"/>
        <rect x="188" y="214" width="34" height="28" rx="5" fill="${accentHex}"/>
        <rect x="230" y="214" width="340" height="28" rx="5" fill="#DCE3ED"/>
        <rect x="578" y="214" width="34" height="28" rx="5" fill="#465368"/>
        <rect x="188" y="250" width="424" height="28" rx="5" fill="#DCE3ED"/>
        <rect x="188" y="286" width="366" height="28" rx="5" fill="#DCE3ED"/>
        <rect x="562" y="286" width="50" height="28" rx="5" fill="${accentHex}"/>
        <rect x="188" y="322" width="120" height="32" rx="5" fill="#8C98AA"/>
        <rect x="316" y="322" width="168" height="32" rx="5" fill="#DCE3ED"/>
        <rect x="492" y="322" width="120" height="32" rx="5" fill="#8C98AA"/>
      `;
    case "air_duster":
      return `
        <rect x="355" y="215" width="76" height="205" rx="24" fill="url(#bodyGrad)" stroke="#465264" stroke-width="2.5"/>
        <rect x="275" y="165" width="215" height="78" rx="34" fill="url(#bodyGrad)" stroke="#465264" stroke-width="2.5"/>
        <polygon points="490,182 592,194 592,214 490,226" fill="${secondaryFinish}" stroke="${accentHex}" stroke-width="2"/>
        <rect x="345" y="264" width="14" height="36" rx="6" fill="${accentHex}"/>
      `;
    case "handheld_vac":
      return `
        <rect x="175" y="242" width="440" height="92" rx="44" fill="url(#bodyGrad)" stroke="#222933" stroke-width="2.5"/>
        <line x1="355" y1="242" x2="355" y2="334" stroke="${accentHex}" stroke-width="4"/>
        <rect x="195" y="256" width="145" height="64" rx="28" fill="#222933" fill-opacity="0.18"/>
        <circle cx="412" cy="288" r="12" fill="${accentHex}"/>
      `;
    case "car_vac":
      return `
        <path d="M185 315 L325 235 L545 235 C585 235 605 265 605 295 C605 325 585 345 545 345 L195 345 Z" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="3"/>
        <path d="M420 235 Q485 182 552 235" fill="none" stroke="${secondaryFinish}" stroke-width="18" stroke-linecap="round"/>
        <circle cx="485" cy="292" r="14" fill="${accentHex}"/>
      `;
    case "phone_tripod":
      return `
        <rect x="388" y="145" width="24" height="215" rx="8" fill="url(#bodyGrad)"/>
        <rect x="335" y="128" width="130" height="44" rx="10" fill="${secondaryFinish}" stroke="${accentHex}" stroke-width="2.5"/>
        <line x1="400" y1="352" x2="295" y2="442" stroke="${primaryFinish}" stroke-width="16" stroke-linecap="round"/>
        <line x1="400" y1="352" x2="505" y2="442" stroke="${primaryFinish}" stroke-width="16" stroke-linecap="round"/>
        <line x1="400" y1="352" x2="400" y2="448" stroke="${secondaryFinish}" stroke-width="14" stroke-linecap="round"/>
        <rect x="391" y="252" width="18" height="36" rx="6" fill="${accentHex}"/>
      `;
    case "lavalier_mic":
      return `
        <rect x="245" y="255" width="310" height="165" rx="26" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="3"/>
        <rect x="282" y="155" width="64" height="112" rx="16" fill="${primaryFinish}" stroke="#6B788D" stroke-width="2"/>
        <circle cx="314" cy="152" r="22" fill="#3B4554"/>
        <rect x="454" y="155" width="64" height="112" rx="16" fill="${primaryFinish}" stroke="#6B788D" stroke-width="2"/>
        <circle cx="486" cy="152" r="22" fill="#3B4554"/>
        <rect x="368" y="182" width="64" height="82" rx="12" fill="${secondaryFinish}" stroke="${accentHex}" stroke-width="2.5"/>
        <rect x="388" y="166" width="24" height="16" rx="3" fill="#B8C2D1"/>
      `;
    case "ring_light":
      return `
        <circle cx="400" cy="242" r="112" fill="none" stroke="#FAFBFC" stroke-width="26"/>
        <circle cx="400" cy="242" r="125" fill="none" stroke="#202630" stroke-width="4"/>
        <circle cx="400" cy="242" r="99" fill="none" stroke="${accentHex}" stroke-width="3"/>
        <rect x="366" y="218" width="68" height="48" rx="8" fill="#202630"/>
        <rect x="392" y="354" width="16" height="78" fill="#202630"/>
        <ellipse cx="400" cy="436" rx="92" ry="16" fill="#202630"/>
      `;
    case "car_charger":
      return `
        <rect x="338" y="160" width="124" height="92" rx="24" fill="url(#bodyGrad)" stroke="${accentHex}" stroke-width="3"/>
        <rect x="356" y="252" width="88" height="156" rx="22" fill="${secondaryFinish}"/>
        <rect x="386" y="408" width="28" height="22" rx="10" fill="#B9C4D4"/>
        <rect x="380" y="190" width="40" height="12" rx="6" fill="#0E1116"/>
        <rect x="378" y="214" width="44" height="14" rx="3" fill="#0E1116"/>
      `;
    case "dashcam":
      return `
        <rect x="215" y="205" width="245" height="135" rx="28" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="3"/>
        <circle cx="338" cy="272" r="46" fill="#0B0E14" stroke="${accentHex}" stroke-width="4"/>
        <circle cx="338" cy="272" r="20" fill="#1F2C44"/>
        <rect x="492" y="242" width="112" height="72" rx="34" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="2.5"/>
        <circle cx="548" cy="278" r="22" fill="#0B0E14" stroke="#84ADFF" stroke-width="3"/>
      `;
    case "tyre_inflator":
      return `
        <path d="M335 165 L335 122 Q335 96 395 96 L465 96" fill="none" stroke="${accentHex}" stroke-width="12" stroke-linecap="round"/>
        <rect x="295" y="165" width="210" height="275" rx="28" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="3"/>
        <rect x="328" y="198" width="144" height="82" rx="12" fill="#0B0E13"/>
        <text x="348" y="250" font-family="monospace" font-size="34" font-weight="700" fill="#EDF1F7">33.5</text>
        <text x="434" y="250" font-family="monospace" font-size="13" fill="${accentHex}">PSI</text>
        <circle cx="400" cy="356" r="38" fill="${secondaryFinish}" stroke="${accentHex}" stroke-width="3"/>
      `;
    case "fm_receiver":
      return `
        <rect x="315" y="165" width="170" height="118" rx="26" fill="url(#bodyGrad)" stroke="${secondaryFinish}" stroke-width="3"/>
        <rect x="342" y="190" width="116" height="44" rx="8" fill="#0B0E13"/>
        <text x="356" y="220" font-family="monospace" font-size="24" font-weight="700" fill="${accentHex}">104.8</text>
        <circle cx="492" cy="224" r="20" fill="${accentHex}"/>
        <rect x="368" y="283" width="64" height="132" rx="20" fill="${secondaryFinish}"/>
      `;
    case "travel_kit":
      return `
        <circle cx="400" cy="285" r="138" fill="url(#bodyGrad)" stroke="#1E242D" stroke-width="3"/>
        <circle cx="400" cy="285" r="108" fill="none" stroke="${accentHex}" stroke-width="3" stroke-dasharray="10 8"/>
        <rect x="342" y="224" width="116" height="24" rx="8" fill="#1E242D"/>
        <rect x="332" y="268" width="38" height="48" rx="6" fill="#1E242D"/>
        <rect x="381" y="268" width="38" height="48" rx="6" fill="${accentHex}"/>
        <rect x="430" y="268" width="38" height="48" rx="6" fill="#1E242D"/>
        <line x1="350" y1="344" x2="450" y2="344" stroke="#1E242D" stroke-width="5" stroke-linecap="round"/>
      `;
  }
}

function renderFrontSvg(spec: PackshotSpec): string {
  const num = pad2(spec.index);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img" aria-label="${esc(spec.shortName)} studio front packshot">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F6F8FB"/>
      <stop offset="100%" stop-color="#E3E8F0"/>
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${spec.primaryFinish}"/>
      <stop offset="100%" stop-color="${spec.secondaryFinish}"/>
    </linearGradient>
    <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#111418" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#111418" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bgGrad)"/>
  <g stroke="#CFD7E3" stroke-width="1" opacity="0.55">
    <line x1="48" y1="88" x2="752" y2="88"/>
    <line x1="48" y1="512" x2="752" y2="512"/>
  </g>
  <text x="52" y="64" font-family="monospace" font-size="13" font-weight="700" letter-spacing="1.5" fill="#434B56">POCKET THEORY // ${esc(spec.categoryLabel)}</text>
  <text x="748" y="64" text-anchor="end" font-family="monospace" font-size="13" font-weight="700" fill="#1849C6">${esc(spec.sku)}</text>
  <text x="690" y="218" text-anchor="end" font-family="sans-serif" font-size="128" font-weight="800" fill="#111418" fill-opacity="0.06">${num}</text>
  <ellipse cx="400" cy="466" rx="185" ry="24" fill="url(#shadowGrad)"/>
  ${renderDeviceArtwork(spec)}
  <rect x="52" y="530" width="380" height="36" rx="6" fill="#111418"/>
  <circle cx="72" cy="548" r="5" fill="${spec.accentHex}"/>
  <text x="88" y="553" font-family="monospace" font-size="12" font-weight="700" fill="#EDF1F7">${esc(spec.calloutBadge)}</text>
  <text x="748" y="553" text-anchor="end" font-family="monospace" font-size="12" fill="#434B56">ILLUSTRATIVE STUDIO PACKSHOT</text>
</svg>
`;
}

function renderDetailSvg(spec: PackshotSpec): string {
  const num = pad2(spec.index);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img" aria-label="${esc(spec.shortName)} port and hardware architecture detail">
  <defs>
    <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${spec.primaryFinish}"/>
      <stop offset="100%" stop-color="${spec.secondaryFinish}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="#11151C"/>
  <g stroke="#222C3A" stroke-width="1">
    <line x1="48" y1="90" x2="752" y2="90"/>
    <line x1="48" y1="490" x2="752" y2="490"/>
    <line x1="400" y1="90" x2="400" y2="490" stroke-dasharray="4 6"/>
  </g>
  <text x="52" y="62" font-family="monospace" font-size="13" font-weight="700" fill="#FF6B2B">INTERFACE &amp; PORT ARCHITECTURE // #${num}</text>
  <text x="748" y="62" text-anchor="end" font-family="monospace" font-size="13" fill="#A6B2C2">${esc(spec.shortName)}</text>
  <g transform="translate(-115, 10) scale(0.84)">
    ${renderDeviceArtwork(spec)}
  </g>
  <rect x="440" y="148" width="308" height="270" rx="12" fill="#18202B" stroke="#2D3A4D" stroke-width="1.5"/>
  <text x="464" y="186" font-family="monospace" font-size="12" font-weight="700" fill="#84ADFF">PRIMARY INTERFACE</text>
  <text x="464" y="212" font-family="sans-serif" font-size="15" font-weight="700" fill="#EDF1F7">${esc(spec.portSummary)}</text>
  <line x1="464" y1="234" x2="724" y2="234" stroke="#2D3A4D"/>
  <text x="464" y="264" font-family="monospace" font-size="12" font-weight="700" fill="#FF6B2B">ENVELOPE &amp; MASS</text>
  <text x="464" y="290" font-family="monospace" font-size="13" fill="#EDF1F7">${esc(spec.dimensionsLabel)}</text>
  <line x1="464" y1="312" x2="724" y2="312" stroke="#2D3A4D"/>
  <text x="464" y="342" font-family="monospace" font-size="12" font-weight="700" fill="#A6B2C2">SPECIFICATION NOTE</text>
  <text x="464" y="366" font-family="sans-serif" font-size="13" fill="#A6B2C2">Target design profile for demo store.</text>
  <text x="464" y="388" font-family="sans-serif" font-size="13" fill="#A6B2C2">Verify batch lab sheet before live sale.</text>
  <text x="52" y="542" font-family="monospace" font-size="12" fill="#A6B2C2">SKU ${esc(spec.sku)} // POCKET THEORY INDUSTRIAL DESIGN SHEET</text>
</svg>
`;
}

function renderSpecSvg(spec: PackshotSpec): string {
  const boxItems = spec.boxShort
    .map(
      (item, idx) => `
      <g transform="translate(${64 + idx * 172}, 356)">
        <rect width="156" height="92" rx="10" fill="#FFFFFF" stroke="#C8D0DC" stroke-width="1.5"/>
        <circle cx="24" cy="28" r="10" fill="#FDE8DF"/>
        <text x="24" y="32" text-anchor="middle" font-family="monospace" font-size="11" font-weight="700" fill="#C93D00">${idx + 1}</text>
        <text x="16" y="64" font-family="sans-serif" font-size="13" font-weight="700" fill="#111418">${esc(item)}</text>
      </g>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img" aria-label="${esc(spec.shortName)} box contents and dimensions sheet">
  <rect width="800" height="600" fill="#EEF1F5"/>
  <rect x="44" y="44" width="712" height="512" rx="16" fill="#F9FAFB" stroke="#C8D0DC" stroke-width="1.5"/>
  <text x="68" y="88" font-family="monospace" font-size="13" font-weight="700" fill="#1849C6">IN THE BOX &amp; PHYSICAL FOOTPRINT</text>
  <text x="732" y="88" text-anchor="end" font-family="monospace" font-size="13" font-weight="700" fill="#111418">${esc(spec.sku)}</text>
  <rect x="64" y="116" width="672" height="196" rx="12" fill="#E4E9F0" stroke="#C8D0DC"/>
  <text x="92" y="164" font-family="sans-serif" font-size="28" font-weight="800" fill="#111418">${esc(spec.shortName)}</text>
  <text x="92" y="198" font-family="monospace" font-size="14" fill="#434B56">${esc(spec.calloutBadge)}</text>
  <line x1="92" y1="238" x2="540" y2="238" stroke="#1849C6" stroke-width="2"/>
  <line x1="92" y1="230" x2="92" y2="246" stroke="#1849C6" stroke-width="2"/>
  <line x1="540" y1="230" x2="540" y2="246" stroke="#1849C6" stroke-width="2"/>
  <text x="92" y="268" font-family="monospace" font-size="14" font-weight="700" fill="#111418">ENVELOPE: ${esc(spec.dimensionsLabel)}</text>
  <text x="68" y="340" font-family="monospace" font-size="12" font-weight="700" fill="#434B56">INCLUDED RETAIL CARTON ITEMS (NET QUANTITY: 1 N UNIT + ACCESSORIES)</text>
  ${boxItems}
  <text x="68" y="518" font-family="monospace" font-size="12" fill="#434B56">POCKET THEORY // MUMBAI, IN // ILLUSTRATIVE PACKAGING SPECIFICATION</text>
</svg>
`;
}

function renderFallbackSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img" aria-label="Pocket Theory hardware product placeholder">
  <rect width="800" height="600" fill="#EEF1F5"/>
  <rect x="260" y="160" width="280" height="280" rx="28" fill="#1B2028" stroke="#C93D00" stroke-width="3"/>
  <text x="400" y="308" text-anchor="middle" font-family="monospace" font-size="24" font-weight="700" fill="#EDF1F7">POCKET THEORY</text>
</svg>
`;
}

const outDir = path.resolve(process.cwd(), "public", "products");
mkdirSync(outDir, { recursive: true });

let written = 0;
for (const spec of PACKSHOT_SPECS) {
  writeFileSync(
    path.join(outDir, `${spec.slug}-front.svg`),
    renderFrontSvg(spec),
    "utf8",
  );
  writeFileSync(
    path.join(outDir, `${spec.slug}-detail.svg`),
    renderDetailSvg(spec),
    "utf8",
  );
  writeFileSync(
    path.join(outDir, `${spec.slug}-spec.svg`),
    renderSpecSvg(spec),
    "utf8",
  );
  written += 3;
}
writeFileSync(path.join(outDir, "fallback.svg"), renderFallbackSvg(), "utf8");
written += 1;

console.log(`Generated ${written} studio SVG packshot assets across ${PACKSHOT_SPECS.length} SKUs.`);
