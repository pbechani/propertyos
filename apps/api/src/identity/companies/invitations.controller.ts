import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../rbac/jwt-auth.guard';
import { CompanyInvitationsService, RegisterViaInviteDto } from './company-invitations.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users.service';

type RequestWithOptionalUser = {
  ip: string;
  headers: Record<string, string | string[] | undefined>;
  user?: { sub: string; email: string; roles: string[] };
};

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: CompanyInvitationsService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Public — check whether an email address already has an account.
   * Used by the invitation acceptance flow to auto-route to login vs register.
   * Deliberately returns only a boolean to limit information exposure.
   */
  @Get('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Query('email') email: string): Promise<{ exists: boolean }> {
    if (!email) return { exists: false };
    const user = await this.usersService.findByEmail(email);
    return { exists: user !== null };
  }

  /**
   * Public — anyone (including unauthenticated visitors) can preview an
   * invitation so the frontend can render the invitation details before the
   * user logs in or registers.
   */
  @Get(':token')
  @HttpCode(HttpStatus.OK)
  previewInvitation(@Param('token') token: string) {
    return this.invitationsService.preview(token);
  }

  /**
   * Authenticated — existing user accepts an invitation.
   * The JWT must belong to the email address the invitation was sent to.
   */
  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  acceptInvitation(
    @Req() req: RequestWithOptionalUser,
    @Param('token') token: string,
  ) {
    return this.invitationsService.accept(
      token,
      req.user!.sub,
      req.user!.email,
      {
        ip: req.ip,
        userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
      },
    );
  }

  /**
   * Public — new user registers and accepts the invitation in one atomic step.
   * The registration email must match the invited email.
   * Returns auth tokens so the frontend can log the user in immediately.
   */
  @Post(':token/register-and-accept')
  @HttpCode(HttpStatus.CREATED)
  registerAndAccept(
    @Req() req: RequestWithOptionalUser,
    @Param('token') token: string,
    @Body() body: RegisterViaInviteDto,
  ) {
    return this.invitationsService.registerAndAccept(token, body, {
      ip: req.ip,
      userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
    });
  }
}
