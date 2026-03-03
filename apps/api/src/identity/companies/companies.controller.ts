import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentStorageService } from '../document-storage.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../rbac/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { CompaniesService } from './companies.service';
import { CompanyMembersService } from './company-members.service';
import { CompanyInvitationsService } from './company-invitations.service';
import { CompanyContextGuard } from './guards/company-context.guard';
import { CompanyAdminGuard } from './guards/company-admin.guard';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  RejectCompanyDto,
  SuspendCompanyDto,
  ListCompaniesQueryDto,
} from './dto/company.dto';
import { InviteMemberDto, UpdateMemberPermissionsDto } from './dto/member.dto';
import { JwtPayload } from '../auth/auth.types';

type RequestWithUser = {
  ip: string;
  headers: Record<string, string>;
  user: JwtPayload;
};

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly membersService: CompanyMembersService,
    private readonly invitationsService: CompanyInvitationsService,
    private readonly documentStorageService: DocumentStorageService,
  ) {}

  // ----------------------------------------------------------------
  // Company Registration & Management
  // ----------------------------------------------------------------

  @Post('companies')
  create(@Req() req: RequestWithUser, @Body() body: CreateCompanyDto) {
    return this.companiesService.create(body, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get('companies/:id')
  @UseGuards(CompanyContextGuard)
  findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Get('companies/:id/dashboard')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  getDashboard(@Param('id') id: string) {
    return this.companiesService.getDashboard(id);
  }

  @Post('companies/:id/logo')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }

    const uploaded = await this.documentStorageService.upload({
      context: 'company-logos',
      userId: req.user.sub,
      documentType: 'logo',
      file,
    });

    await this.companiesService.update(
      id,
      { logo_url: uploaded.publicUrl },
      req.user.sub,
      { ip: req.ip, userAgent: req.headers['user-agent'] ?? null },
    );

    return { url: uploaded.publicUrl };
  }

  @Patch('companies/:id')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, body, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('companies/:id/submit-verification')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  submitVerification(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.companiesService.submitForVerification(id, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('companies/:id/deactivate')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  deactivate(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.companiesService.deactivate(id, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  // ----------------------------------------------------------------
  // Platform Admin endpoints
  // ----------------------------------------------------------------

  @Get('admin/companies')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listAll(@Query() query: ListCompaniesQueryDto) {
    return this.companiesService.listForAdmin(query);
  }

  @Get('admin/companies/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  adminFindOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Post('admin/companies/:id/verify')
  @UseGuards(RolesGuard)
  @Roles('admin')
  verify(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.companiesService.verify(id, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('admin/companies/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  reject(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: RejectCompanyDto,
  ) {
    return this.companiesService.reject(id, body.reason, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('admin/companies/:id/suspend')
  @UseGuards(RolesGuard)
  @Roles('admin')
  suspend(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: SuspendCompanyDto,
  ) {
    return this.companiesService.suspend(id, body.reason, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  // ----------------------------------------------------------------
  // Member Management
  // ----------------------------------------------------------------

  @Get('companies/:id/members')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  listMembers(@Param('id') id: string) {
    return this.membersService.listMembers(id);
  }

  @Post('companies/:id/members/invite')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  invite(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: InviteMemberDto,
  ) {
    return this.invitationsService.invite(id, body, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get('companies/:id/members/:memberId')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  getMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.membersService.getMember(id, memberId);
  }

  @Patch('companies/:id/members/:memberId/permissions')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  updatePermissions(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberPermissionsDto,
  ) {
    return this.membersService.updatePermissions(id, memberId, body, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('companies/:id/members/:memberId/promote-admin')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  promoteToAdmin(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.promoteToAdmin(id, memberId, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Delete('companies/:id/members/:memberId')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  revokeAccess(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.revokeAccess(id, memberId, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  // ----------------------------------------------------------------
  // Invitations
  // ----------------------------------------------------------------

  @Get('invitations/:token')
  previewInvitation(@Param('token') token: string) {
    return this.invitationsService.preview(token);
  }

  @Post('invitations/:token/accept')
  acceptInvitation(
    @Req() req: RequestWithUser,
    @Param('token') token: string,
  ) {
    return this.invitationsService.accept(token, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Delete('companies/:id/invitations/:inviteId')
  @UseGuards(CompanyContextGuard, CompanyAdminGuard)
  revokeInvitation(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.invitationsService.revoke(inviteId, id, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  // ----------------------------------------------------------------
  // User's companies (self-serve)
  // ----------------------------------------------------------------

  @Get('users/me/companies')
  getMyCompanies(@Req() req: RequestWithUser) {
    return this.membersService.getUserCompanies(req.user.sub);
  }
}
