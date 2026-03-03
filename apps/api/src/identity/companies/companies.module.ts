import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { OrphanedTasksController } from './orphaned-tasks.controller';
import { CompaniesService } from './companies.service';
import { CompanyMembersService } from './company-members.service';
import { CompanyInvitationsService } from './company-invitations.service';
import { OrphanedTasksService } from './orphaned-tasks.service';
import { CompanyContextGuard } from './guards/company-context.guard';
import { CompanyAdminGuard } from './guards/company-admin.guard';
import { CompanyPermissionGuard } from './guards/company-permission.guard';
import { DocumentStorageService } from '../document-storage.service';

@Module({
  controllers: [CompaniesController, OrphanedTasksController],
  providers: [
    CompaniesService,
    CompanyMembersService,
    CompanyInvitationsService,
    OrphanedTasksService,
    CompanyContextGuard,
    CompanyAdminGuard,
    CompanyPermissionGuard,
    DocumentStorageService,
  ],
  exports: [
    CompaniesService,
    CompanyMembersService,
    CompanyInvitationsService,
    OrphanedTasksService,
    CompanyContextGuard,
    CompanyAdminGuard,
    CompanyPermissionGuard,
  ],
})
export class CompaniesModule {}
