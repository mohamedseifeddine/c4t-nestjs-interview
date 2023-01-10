import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AbstractService } from '../abstract/abstract.service';
import { Auth } from './auth.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  CreateUserWithEmailAndPasswordDto,
  LoginWithEmailAndPasswordDto,
} from './auth.dto';
import { AccessTokenResponseType } from './interfaces/user.interface';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService extends AbstractService<Auth> {
  constructor(
    @InjectModel(Auth.name) private authModel: Model<Auth>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private userService: UserService,
    private jwtService: JwtService,
  ) {
    super(authModel, logger);
  }
  protected modelName = Auth.name;

  async signUpWithEmailAndPassword(
    createUserWithEmailAndPasswordDto: CreateUserWithEmailAndPasswordDto,
  ): Promise<AccessTokenResponseType> {
    let auth = await this.findOne(
      {
        email: createUserWithEmailAndPasswordDto.email,
      },
      null,
      { collation: { locale: 'en', strength: 2 } },
    );
    if (auth) throw new BadRequestException('EMAIL_ALREADY_USED');

    const passwordHashed = this.hash(
      createUserWithEmailAndPasswordDto.password,
    );

    const user = await this.userService.createUser({
      role: createUserWithEmailAndPasswordDto.role,
      email: createUserWithEmailAndPasswordDto.email,
      password: passwordHashed,
    });

    auth = await this.create({
      email: createUserWithEmailAndPasswordDto.email,
      password: passwordHashed,
      user: user._id,
    });
    const access_token = this.accessToken(auth, user._id);
    return { access_token };
  }

  async loginWithEmailAndPassword(
    loginWithEmailAndPasswordDto: LoginWithEmailAndPasswordDto,
  ): Promise<AccessTokenResponseType> {
    const auth = await this.findOne(
      { email: loginWithEmailAndPasswordDto.email },
      null,
      {
        collation: { locale: 'en', strength: 2 },
      },
    );
    if (!auth) throw new BadRequestException('INVALID_EMAIL');
    try {
      this.verifyHash(auth.password, loginWithEmailAndPasswordDto.password);
    } catch (e) {
      throw new BadRequestException('WRONG_PASSWORD');
    }

    const access_token = this.accessToken(auth);
    return { access_token };
  }

  hash(token: string) {
    return crypto.createHash('sha256').update(token).digest('base64');
  }

  verifyHash(hashedToken: string, token: string) {
    const newHashedRefreshToken = this.hash(token);
    if (newHashedRefreshToken != hashedToken) throw new UnauthorizedException();
  }

  accessToken(auth: Auth, user?: Types.ObjectId) {
    return this.jwtService.sign(
      { _id: auth._id, user: user ? user._id : auth.user },
      {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
      },
    );
  }
}
