import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { OAuthVerificationService } from './auth/oauth-verification.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesGuard } from './rbac/roles.guard';
import { PermissionsGuard } from './rbac/permissions.guard';
import { KycController, AdminKycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { DocumentStorageService } from './document-storage.service';
import { NotificationService } from './notification.service';
import { DocumentAccessService } from './document-access.service';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { IdentityBootstrapService } from './identity.bootstrap.service';
// Sprint 01-b: Companies
import { CompaniesController } from './companies/companies.controller';
import { OrphanedTasksController } from './companies/orphaned-tasks.controller';
import { InvitationsController } from './companies/invitations.controller';
import { CompaniesService } from './companies/companies.service';
import { CompanyMembersService } from './companies/company-members.service';
import { CompanyInvitationsService } from './companies/company-invitations.service';
import { OrphanedTasksService } from './companies/orphaned-tasks.service';
import { CompanyContextGuard } from './companies/guards/company-context.guard';
import { CompanyAdminGuard } from './companies/guards/company-admin.guard';
import { CompanyPermissionGuard } from './companies/guards/company-permission.guard';
// Sprint 02 Enhanced: Professional Licences
import {
  ProfessionalLicencesController,
  AdminProfessionalLicencesController,
} from './professional-licences/professional-licences.controller';
import { ProfessionalLicencesService } from './professional-licences/professional-licences.service';
// Sprint 02 Enhanced: Sessions
import { SessionsController } from './sessions/sessions.controller';
import { SessionsService } from './sessions/sessions.service';
// Sprint 02 Enhanced: MFA
import { MfaConfigController } from './mfa/mfa-config.controller';
import { MfaConfigService } from './mfa/mfa-config.service';
// Sprint 02 Enhanced: Agent CRM
import { AgentCrmController } from './agent-crm/agent-crm.controller';
import { AgentCrmService } from './agent-crm/agent-crm.service';
// Sprint 02 Enhanced: Notification Preferences
import { NotificationPreferencesController } from './notification-preferences/notification-preferences.controller';
import { NotificationPreferencesService } from './notification-preferences/notification-preferences.service';

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
    // Sprint 01-b
    CompaniesController,
    OrphanedTasksController,
    InvitationsController,
    // Sprint 02 Enhanced
    ProfessionalLicencesController,
    AdminProfessionalLicencesController,
    SessionsController,
    MfaConfigController,
    AgentCrmController,
    NotificationPreferencesController,
  ],
  providers: [
    AuthService,
    OAuthVerificationService,
    UsersService,
    JwtStrategy,
    RolesGuard,
    PermissionsGuard,
    KycService,
    DocumentStorageService,
    DocumentAccessService,
    NotificationService,
    AuditService,
    IdentityBootstrapService,
    // Sprint 01-b
    CompaniesService,
    CompanyMembersService,
    CompanyInvitationsService,
    OrphanedTasksService,
    CompanyContextGuard,
    CompanyAdminGuard,
    CompanyPermissionGuard,
    // Sprint 02 Enhanced
    ProfessionalLicencesService,
    SessionsService,
    MfaConfigService,
    AgentCrmService,
    NotificationPreferencesService,
  ],
  exports: [
    CompanyContextGuard,
    CompanyAdminGuard,
    CompanyPermissionGuard,
    NotificationService,
  ],
})
export class IdentityModule {}
