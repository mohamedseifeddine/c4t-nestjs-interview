import { Injectable, CanActivate, ExecutionContext,Request } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { Role } from '../auth/interfaces/user.interface';



@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector,private userService:UserService) {}

  matchRoles(roles: Role[], userRole: string) {
    return roles.some((role) => role === userRole);
  }
  getUser(id:Types.ObjectId) { 
    return this.userService.getUser(id)
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    
    const role = await this.getUser(request.auth.user).then(user => {
      return user.role;
    })
    return this.matchRoles(roles,role);

  }
}
