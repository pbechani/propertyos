import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	private readonly logger = new Logger(JwtAuthGuard.name);

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<{
			method?: string;
			url?: string;
			headers?: Record<string, string | string[] | undefined>;
		}>();

		const hasAuthorizationHeader = Boolean(request?.headers?.authorization);

		try {
			return (await super.canActivate(context)) as boolean;
		} catch (error) {
			this.logger.warn(
				`JWT guard rejected request ${request?.method ?? 'UNKNOWN'} ${request?.url ?? '-'} (authorizationHeader=${hasAuthorizationHeader})`,
			);
			throw error;
		}
	}

	handleRequest<TUser = unknown>(
		err: unknown,
		user: TUser,
		info: { message?: string } | string | undefined,
		context: ExecutionContext,
	): TUser {
		if (err || !user) {
			const request = context.switchToHttp().getRequest<{
				method?: string;
				url?: string;
			}>();

			const reason =
				typeof info === 'string'
					? info
					: info?.message ?? (err instanceof Error ? err.message : 'unknown');

			this.logger.warn(
				`JWT authentication failed for ${request?.method ?? 'UNKNOWN'} ${request?.url ?? '-'}: ${reason}`,
			);

			throw err instanceof Error ? err : new UnauthorizedException('Authentication required');
		}

		return user;
	}
}
