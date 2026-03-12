import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database';
import { PAYMENT_METHOD, PAYMENT_STATUS } from './financial.constants';

export interface GatewayChargeParams {
  accountId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  metadata?: Record<string, unknown>;
  initiatedBy: string;
  idempotencyKey?: string;
}

export interface GatewayResult {
  paymentRequestId: string;
  gatewayReference?: string;
  gatewayStatus: string;
  redirectUrl?: string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  private readonly stripeKey: string;
  private readonly flutterwaveKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripeKey = this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
    this.flutterwaveKey = this.config.get<string>('FLUTTERWAVE_SECRET_KEY') ?? '';
  }

  /** Initiates a payment charge via the appropriate gateway. */
  async initiateCharge(params: GatewayChargeParams): Promise<GatewayResult> {
    const request = await this.prisma.paymentRequest.create({
      data: {
        accountId: params.accountId,
        amount: params.amount,
        currency: params.currency,
        paymentMethod: params.paymentMethod,
        status: PAYMENT_STATUS.PENDING,
        initiatedBy: params.initiatedBy,
      },
    });

    try {
      let result: GatewayResult;
      if (params.paymentMethod === PAYMENT_METHOD.STRIPE) {
        result = await this.chargeViaStripe(request.id, params);
      } else if (params.paymentMethod === PAYMENT_METHOD.FLUTTERWAVE) {
        result = await this.chargeViaFlutterwave(request.id, params);
      } else {
        // Bank transfer: manual confirmation pending
        result = { paymentRequestId: request.id, gatewayStatus: PAYMENT_STATUS.PENDING };
      }

      await this.prisma.paymentRequest.update({
        where: { id: request.id },
        data: { gatewayReference: result.gatewayReference, gatewayStatus: result.gatewayStatus },
      });

      return { ...result, paymentRequestId: request.id };
    } catch (err) {
      await this.prisma.paymentRequest.update({
        where: { id: request.id },
        data: { status: PAYMENT_STATUS.FAILED, gatewayStatus: 'error' },
      });
      throw err;
    }
  }

  /** Marks a payment request as completed after webhook/manual confirmation. */
  async confirmPayment(paymentRequestId: string, gatewayReference: string, gatewayStatus: string) {
    return this.prisma.paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        status: PAYMENT_STATUS.COMPLETED,
        gatewayReference,
        gatewayStatus,
      },
    });
  }

  /** Looks up a payment request by its gateway reference (idempotency). */
  async findByGatewayReference(gatewayReference: string) {
    return this.prisma.paymentRequest.findUnique({ where: { gatewayReference } });
  }

  // ─── Private gateway implementations ─────────────────────────────────────────

  private async chargeViaStripe(
    requestId: string,
    params: GatewayChargeParams,
  ): Promise<GatewayResult> {
    if (!this.stripeKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set — returning mock gateway result');
      return {
        paymentRequestId: requestId,
        gatewayReference: `stripe_mock_${requestId}`,
        gatewayStatus: 'requires_payment_method',
        redirectUrl: undefined,
      };
    }

    const amountCents = Math.round(params.amount * 100);
    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': params.idempotencyKey ?? requestId,
      },
      body: new URLSearchParams({
        amount: String(amountCents),
        currency: params.currency.toLowerCase(),
        'metadata[paymentRequestId]': requestId,
        'metadata[accountId]': params.accountId,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Stripe error ${res.status}: ${body}`);
    }

    const intent = (await res.json()) as { id: string; status: string; client_secret: string };
    return {
      paymentRequestId: requestId,
      gatewayReference: intent.id,
      gatewayStatus: intent.status,
    };
  }

  private async chargeViaFlutterwave(
    requestId: string,
    params: GatewayChargeParams,
  ): Promise<GatewayResult> {
    if (!this.flutterwaveKey) {
      this.logger.warn('FLUTTERWAVE_SECRET_KEY not set — returning mock gateway result');
      return {
        paymentRequestId: requestId,
        gatewayReference: `flw_mock_${requestId}`,
        gatewayStatus: 'NEW',
      };
    }

    const res = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.flutterwaveKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: params.idempotencyKey ?? requestId,
        amount: params.amount,
        currency: params.currency,
        meta: { paymentRequestId: requestId, accountId: params.accountId },
        customizations: { title: 'Escrow Deposit' },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Flutterwave error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as { data: { link: string }; status: string };
    return {
      paymentRequestId: requestId,
      gatewayStatus: data.status,
      redirectUrl: data.data?.link,
    };
  }
}
