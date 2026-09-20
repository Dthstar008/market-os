import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Every request is scoped to the authenticated user's trader profile.
 * Pulls traderId off req.user, set by JwtStrategy.validate().
 */
export const CurrentTraderId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.user.traderId;
});

export const CurrentUserId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.user.userId;
});
