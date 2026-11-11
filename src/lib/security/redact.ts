export function redactEmail(email: string): string {
  const trimmed = email.trim();
  const atIdx = trimmed.indexOf("@");
  if (atIdx <= 0) return "***";
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function redactIndianPhone(phone: string | null | undefined): string {
  if (!phone) return "Not provided";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "******";
  const last4 = digits.slice(-4);
  return `+91 ******${last4}`;
}

export function redactAddressLine(line: string): string {
  if (line.length <= 8) return "***";
  return `${line.slice(0, 6)}... (redacted)`;
}
