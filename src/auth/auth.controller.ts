import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseObject } from '../abstract/response.object';
import { AccessTokenResponseType } from './interfaces/user.interface';
import {
  CreateUserWithEmailAndPasswordDto,
  LoginWithEmailAndPasswordDto,
} from './auth.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async signUpWithEmailAndPassword(
    @Body()
    createUserWithEmailAndPasswordDto: CreateUserWithEmailAndPasswordDto,
  ): Promise<ResponseObject<AccessTokenResponseType>> {
    const res = await this.authService.signUpWithEmailAndPassword(
      createUserWithEmailAndPasswordDto,
    );
    return new ResponseObject('REGISTER_SUCCEEDED', res);
  }

  @Post('login')
  async loginWithEmailAndPassword(
    @Body() loginWithEmailAndPasswordDto: LoginWithEmailAndPasswordDto,
  ): Promise<ResponseObject<AccessTokenResponseType>> {
    const data = await this.authService.loginWithEmailAndPassword(
      loginWithEmailAndPasswordDto,
    );
    return new ResponseObject('LOGIN_SUCCEEDED', data);
  }
}
