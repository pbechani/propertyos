import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesGuard } from './rbac/roles.guard';
import { KycController, AdminKycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { DocumentStorageService } from './document-storage.service';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { IdentityBootstrapService } from './identity.bootstrap.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ??
          'development-only-jwt-secret-change-me-123456',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRY') ?? '15m',
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
    UsersController,
    KycController,
    AdminKycController,
    AuditController,
  ],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    RolesGuard,
    KycService,
    DocumentStorageService,
    NotificationService,
    AuditService,
    IdentityBootstrapService,
  ],
})
export class IdentityModule {}
