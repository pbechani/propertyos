export const PLATFORM_INCOMING_ACCOUNT = 'PLATFORM-INCOMING-USD';
export const PLATFORM_COMMISSION_ACCOUNT = 'PLATFORM-COMMISSION-USD';
export const PLATFORM_FEE_ACCOUNT = 'PLATFORM-FEE-USD';

export const ESCROW_ACCOUNT_TYPE = 'escrow';
export const BUYER_WALLET_TYPE = 'buyer_wallet';
export const SELLER_WALLET_TYPE = 'seller_wallet';
export const AGENT_WALLET_TYPE = 'agent_wallet';
export const PLATFORM_ACCOUNT_TYPE = 'platform';

export const LEDGER_ENTRY = {
  ESCROW_DEPOSIT: 'escrow_deposit',
  ESCROW_RELEASE: 'escrow_release',
  COMMISSION_CREDIT: 'commission_credit',
  PLATFORM_FEE: 'platform_fee',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment',
} as const;

export const PAYMENT_METHOD = {
  STRIPE: 'stripe',
  FLUTTERWAVE: 'flutterwave',
  BANK_TRANSFER: 'bank_transfer',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const ESCROW_RELEASE_STATUS = {
  PENDING: 'pending',
  BUYER_APPROVED: 'buyer_approved',
  APPROVED: 'approved',
  RELEASED: 'released',
  REJECTED: 'rejected',
} as const;

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  CLOSED: 'closed',
} as const;

export const ESCROW_CONDITION_TYPE = {
  STAGE_REACHED: 'stage_reached',
  DOCUMENT_VERIFIED: 'document_verified',
  INSPECTION_PASSED: 'inspection_passed',
  MANUAL_APPROVAL: 'manual_approval',
} as const;

export const FX_CACHE_TTL_SECONDS = 3600; // 1 hour
export const FX_CACHE_KEY_PREFIX = 'fx_rate';
export const DEFAULT_CURRENCY = 'USD';
export const SUPPORTED_CURRENCIES = ['USD', 'ZAR', 'GBP', 'EUR', 'NGN', 'KES', 'GHS'] as const;

export const FINANCIAL_AUDIT_ACTIONS = {
  ACCOUNT_CREATED: 'account.created',
  DEPOSIT_INITIATED: 'deposit.initiated',
  DEPOSIT_CONFIRMED: 'deposit.confirmed',
  ESCROW_RELEASE_REQUESTED: 'escrow_release.requested',
  ESCROW_RELEASE_BUYER_APPROVED: 'escrow_release.buyer_approved',
  ESCROW_RELEASE_ADMIN_APPROVED: 'escrow_release.admin_approved',
  ESCROW_RELEASED: 'escrow.released',
  ESCROW_RELEASE_REJECTED: 'escrow_release.rejected',
  COMMISSION_CALCULATED: 'commission.calculated',
  REFUND_ISSUED: 'refund.issued',
  HIGH_VALUE_FLAGGED: 'high_value.flagged',
  WEBHOOK_RECEIVED: 'webhook.received',
} as const;
