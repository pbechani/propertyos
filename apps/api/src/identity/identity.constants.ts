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
] as const;

export type IdentityRole = (typeof IDENTITY_ROLES)[number];

export const DEFAULT_ROLE: IdentityRole = 'buyer_seller';

/**
 * Roles that can be selected during self-registration.
 * 'admin' is intentionally excluded — admin accounts must be assigned by existing admins.
 */
export const SELF_REGISTRATION_ROLES = IDENTITY_ROLES.filter(
  (r) => r !== 'admin',
) as ReadonlyArray<IdentityRole>;

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
