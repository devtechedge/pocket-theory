export function sanitizeInternalPath(raw: string | undefined | null): string {
  if (!raw) return "/account";
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("://")
  ) {
    return "/account";
  }
  return trimmed;
}
