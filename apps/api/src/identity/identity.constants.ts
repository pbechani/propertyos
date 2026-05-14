export const IDENTITY_ROLES = [
  'buyer_seller',
  'investor',
  'contractor',
  'supplier',
  'agent',
  'conveyancer',
  'inspector',
  'admin',
  'truck_operator',
  // Sprint 02 Enhanced — additional professional roles
  'valuer',
  'developer',
  'mortgage_broker',
  'quantity_surveyor',
  'brokerage_admin',
  'bank_officer',
] as const;

/**
 * Roles that require professional licence verification before they can
 * be self-assigned. The user's KYC must also be at 'Professional' tier.
 */
export const PROFESSIONAL_ROLES = [
  'valuer',
  'conveyancer',
  'inspector',
  'mortgage_broker',
  'quantity_surveyor',
] as const;

/**
 * Role pairs (role_a, role_b) that cannot be held simultaneously.
 * Enforced at the application layer in addition to DB constraints.
 * role_b is forbidden when role_a is already held.
 */
export const ROLE_EXCLUSION_PAIRS: Array<[string, string]> = [
  ['admin', 'agent'],
  ['admin', 'contractor'],
  ['admin', 'supplier'],
  ['admin', 'mortgage_broker'],
  ['admin', 'brokerage_admin'],
];

export type IdentityRole = (typeof IDENTITY_ROLES)[number];

export const DEFAULT_ROLE: IdentityRole = 'buyer_seller';

/**
 * Roles that can be selected during self-registration.
 * 'admin' is intentionally excluded — admin accounts must be assigned by existing admins.
 */
export const SELF_REGISTRATION_ROLES = IDENTITY_ROLES.filter(
  (r) => r !== 'admin',
) as ReadonlyArray<IdentityRole>;

/**
 * The slug of the built-in "Self" system company.
 * Every registered user is automatically enrolled as a buyer_seller member.
 * This company cannot be modified or deleted by users.
 */
export const SELF_COMPANY_SLUG = 'self';

export const IDENTITY_PERMISSIONS: Array<{ resource: string; action: string }> =
  [
    { resource: 'property', action: 'read' },
    { resource: 'property', action: 'create' },
    { resource: 'property', action: 'update' },
    { resource: 'property', action: 'full' },
    { resource: 'project', action: 'read' },
    { resource: 'project', action: 'create' },
    { resource: 'project', action: 'update' },
    { resource: 'project', action: 'full' },
    { resource: 'escrow', action: 'deposit' },
    { resource: 'escrow', action: 'read' },
    { resource: 'escrow', action: 'full' },
    { resource: 'users', action: 'self' },
    { resource: 'users', action: 'full' },
    { resource: 'kyc', action: 'submit' },
    { resource: 'kyc', action: 'approve' },
  ];
