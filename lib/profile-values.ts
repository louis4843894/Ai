export function normalizeEmail(email: string): string {
  return email.trim();
}

export function normalizeDisplayName(displayName: string): string {
  return displayName.trim();
}

export function getRegistrationDisplayName(displayName: string): string {
  return normalizeDisplayName(displayName) || "團購會員";
}
