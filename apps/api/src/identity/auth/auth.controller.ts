import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto, RefreshTokenDto } from './dto/token.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/password.dto';
import { OAuthLoginDto } from './dto/oauth.dto';
import { SelectContextDto } from './dto/context.dto';
import { JwtAuthGuard } from '../rbac/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { Permissions } from '../rbac/permissions.decorator';

type RequestUser = {
  sub: string;
  email?: string;
  roles?: string[];
};

type RequestMeta = {
  ip: string;
  headers: Record<string, string>;
  user?: RequestUser;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Req() req: RequestMeta,
    @Body() body: RegisterDto,
  ): Promise<unknown> {
    return this.authService.register(body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('login')
  login(@Req() req: RequestMeta, @Body() body: LoginDto): Promise<unknown> {
    return this.authService.login(body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'users', action: 'self' })
  @Post('logout')
  async logout(
    @Req() req: RequestMeta,
    @Body() body: LogoutDto,
  ): Promise<{ success: boolean }> {
    await this.authService.logout(
      body.refreshToken,
      req.user!.sub,
      { ip: req.ip, userAgent: req.headers['user-agent'] ?? null },
      req.user!.roles?.[0] ?? null,
    );
    return { success: true };
  }

  @Post('refresh')
  refresh(
    @Req() req: RequestMeta,
    @Body() body: RefreshTokenDto,
  ): Promise<unknown> {
    return this.authService.refresh(body.refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('forgot-password')
  async forgotPassword(
    @Req() req: RequestMeta,
    @Body() body: ForgotPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.authService.forgotPassword(body.email, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return { success: true };
  }

  @Post('reset-password')
  async resetPassword(
    @Req() req: RequestMeta,
    @Body() body: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.authService.resetPassword(body.token, body.newPassword, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'users', action: 'self' })
  @Post('change-password')
  async changePassword(
    @Req() req: RequestMeta,
    @Body() body: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    await this.authService.changePassword(
      req.user!.sub,
      body.currentPassword,
      body.newPassword,
      {
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      },
    );

    return { success: true };
  }

  @Post('verify-email')
  async verifyEmail(
    @Req() req: RequestMeta,
    @Body() body: VerifyEmailDto,
  ): Promise<{ success: boolean }> {
    await this.authService.verifyEmail(body.token, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'users', action: 'self' })
  @Post('resend-verification-email')
  async resendVerificationEmail(
    @Req() req: RequestMeta,
  ): Promise<{ success: boolean }> {
    await this.authService.resendVerificationEmail(req.user!.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return { success: true };
  }

  @Post('oauth/google')
  oauthGoogle(
    @Req() req: RequestMeta,
    @Body() body: OAuthLoginDto,
  ): Promise<unknown> {
    return this.authService.oauthLogin('google', body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('oauth/apple')
  oauthApple(
    @Req() req: RequestMeta,
    @Body() body: OAuthLoginDto,
  ): Promise<unknown> {
    return this.authService.oauthLogin('apple', body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('oauth/facebook')
  oauthFacebook(
    @Req() req: RequestMeta,
    @Body() body: OAuthLoginDto,
  ): Promise<unknown> {
    return this.authService.oauthLogin('facebook', body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'users', action: 'self' })
  @Get('contexts')
  getContexts(@Req() req: RequestMeta): Promise<unknown> {
    return this.authService.getUserContexts(req.user!.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'users', action: 'self' })
  @Post('contexts/select')
  selectContext(
    @Req() req: RequestMeta,
    @Body() body: SelectContextDto,
  ): Promise<unknown> {
    return this.authService.selectContext(
      req.user!.sub,
      req.user!.email!,
      body.company_id,
      {
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      },
    );
  }
}
