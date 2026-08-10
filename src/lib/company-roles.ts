// Single source of truth for the crm-spec.md §6.1 company_role values —
// imported by the drizzle enum (server) and the role-checkbox UI (client),
// so the client form doesn't need to import the drizzle schema module.
export const COMPANY_ROLES = [
  "customer",
  "supplier",
  "agent",
  "logistics",
  "authority",
  "other",
] as const;
