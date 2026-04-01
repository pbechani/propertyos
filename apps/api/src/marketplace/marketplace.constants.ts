export const RFQ_TYPE = {
  CONTRACTOR: 'contractor',
  SUPPLIER: 'supplier',
} as const;
export type RfqType = (typeof RFQ_TYPE)[keyof typeof RFQ_TYPE];

export const RFQ_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  AWARDED: 'awarded',
  CANCELLED: 'cancelled',
} as const;
export type RfqStatus = (typeof RFQ_STATUS)[keyof typeof RFQ_STATUS];

export const QUOTE_STATUS = {
  SUBMITTED: 'submitted',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;
export type QuoteStatus = (typeof QUOTE_STATUS)[keyof typeof QUOTE_STATUS];

export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  SIGNED_CONTRACTOR: 'signed_contractor',
  SIGNED_CLIENT: 'signed_client',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  TERMINATED: 'terminated',
} as const;
export type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];

export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const DELIVERY_CONDITION = {
  INTACT: 'intact',
  DAMAGED: 'damaged',
  PARTIAL: 'partial',
} as const;
export type DeliveryCondition =
  (typeof DELIVERY_CONDITION)[keyof typeof DELIVERY_CONDITION];

export const RATING_ENTITY_TYPE = {
  CONTRACTOR: 'contractor',
  SUPPLIER: 'supplier',
  BUYER: 'buyer',
} as const;
export type RatingEntityType =
  (typeof RATING_ENTITY_TYPE)[keyof typeof RATING_ENTITY_TYPE];

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const;
export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export const PRICE_TIER = {
  BUDGET: 'budget',
  STANDARD: 'standard',
  PREMIUM: 'premium',
} as const;
export type PriceTier = (typeof PRICE_TIER)[keyof typeof PRICE_TIER];

export const MARKETPLACE_AUDIT_ACTIONS = {
  CONTRACTOR_PROFILE_CREATED: 'contractor.profile.created',
  CONTRACTOR_PROFILE_UPDATED: 'contractor.profile.updated',
  CONTRACTOR_PORTFOLIO_ADDED: 'contractor.portfolio.added',
  SUPPLIER_PROFILE_CREATED: 'supplier.profile.created',
  SUPPLIER_PROFILE_UPDATED: 'supplier.profile.updated',
  SUPPLIER_PRODUCT_CREATED: 'supplier.product.created',
  SUPPLIER_PRODUCT_UPDATED: 'supplier.product.updated',
  RFQ_CREATED: 'rfq.created',
  RFQ_CANCELLED: 'rfq.cancelled',
  QUOTE_SUBMITTED: 'quote.submitted',
  QUOTE_ACCEPTED: 'quote.accepted',
  QUOTE_REJECTED: 'quote.rejected',
  CONTRACT_GENERATED: 'contract.generated',
  CONTRACT_SIGNED: 'contract.signed',
  ORDER_PLACED: 'order.placed',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  RATING_SUBMITTED: 'rating.submitted',
} as const;
