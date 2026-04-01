import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from './database';
import { CacheModule } from './cache';
import { VaultModule } from './common/vault';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics';
import { SentryModule, SentryExceptionFilter } from './common/sentry';
import { envValidationSchema, envValidationOptions } from './config';
import { IdentityModule } from './identity/identity.module';
import { PropertyModule } from './property/property.module';
import { SalesModule } from './sales/sales.module';
import { LeadsModule } from './leads/leads.module';
import { AIIntelligenceModule } from './ai-intelligence/ai-intelligence.module';
import { MindsDBModule } from './mindsdb/mindsdb.module';
import { FinancialModule } from './financial/financial.module';
import { ConveyancingModule } from './conveyancing/conveyancing.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { PublicStatsModule } from './public-stats/public-stats.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),

    // Database
    DatabaseModule,

    // Cache (Redis)
    CacheModule,

    // Secrets Management
    VaultModule.forRoot({
      enabled: process.env.VAULT_ENABLED === 'true',
      address: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN,
    }),

    // Rate limiting - 100 requests per minute global default
    // Auth-specific limit (10/min) is applied via @Throttle on AuthController only
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Error tracking
    SentryModule,

    // Feature modules
    HealthModule,
    MetricsModule,
    IdentityModule,
    PropertyModule,
    SalesModule,
    LeadsModule,
    AIIntelligenceModule,
    MindsDBModule,
    FinancialModule,
    ConveyancingModule,
    MarketplaceModule,
    PublicStatsModule,
    ContactModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
  ],
})
export class AppModule {}
