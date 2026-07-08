import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<('ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT')[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no roles are annotated on the endpoint/controller, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied. No authenticated context or role assigned.');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Insufficient permissions. Required role(s): ${requiredRoles.join(', ')}.`);
    }

    return true;
  }
}
