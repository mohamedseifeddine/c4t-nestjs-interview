import {
  Controller,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseObject } from '../abstract/response.object';
import { User } from './user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getUserProfile(@Request() req): Promise<ResponseObject<User>> {
    const data = await this.userService.findById(req.auth.user);
    return new ResponseObject('FOUND_USER', data);
  }

}
