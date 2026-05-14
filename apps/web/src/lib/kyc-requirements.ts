const BUSINESS_LICENSE_REQUIRED_ROLES = new Set([
  "agent",
  "contractor",
  "supplier",
  "conveyancer",
  "inspector",
  "property_manager",
]);

export function requiresBusinessLicenseForRole(role: string | null | undefined): boolean {
  if (!role) {
    return false;
  }

  return BUSINESS_LICENSE_REQUIRED_ROLES.has(role.toLowerCase());
}
