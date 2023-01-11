import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';
import { MovieService } from '../src/movie/movie.service';
import { MovieModule } from '../src/movie/movie.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston/dist/winston.utilities';
import { AuthModule } from '../src/auth/auth.module';
import { UserModule } from '../src/user/user.module';
import { ExecutionContext, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Types } from 'mongoose';
import * as request from 'supertest';

describe('hello test  (e2e)', () => {
  let app: any;
  let itemService: MovieService;
  const id = '63528874632bc75ac5b59540';
  const user = new Types.ObjectId('6351d04551267afcf544afe2');
  let jwtToken;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '../development.env',
        }),
        MongooseModule.forRoot(process.env.DATABASE_HOST, {
          useUnifiedTopology: true,
          minPoolSize: 20,
          maxPoolSize: 200,
        }),
        JwtModule.register({
          secret: process.env.JWT_ACCESS_TOKEN_SECRET,
          secretOrPrivateKey: process.env.JWT_ACCESS_TOKEN_SECRET,
          signOptions: { expiresIn: '24h' },
        }),
        WinstonModule.forRoot({
          handleExceptions: true,
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.ms(),
                winston.format.timestamp(),
                winston.format.json(),
                nestWinstonModuleUtilities.format.nestLike(
                  'Auction_System-APIs',
                  {
                    prettyPrint: true,
                  },
                ),
                winston.format.align(),
                winston.format.colorize({ all: true }),
              ),
            }),
          ],
        }),
        AuthModule,
        UserModule,
        MovieModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.auth = { user: user };
          req.user = { user: user };
          return true;
        },
      })
      .compile();


    app = await NestFactory.create(AppModule);
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World :D !');
  });
  it('Register', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: "seifadminNew002User@yopmail.com",
        password: 'AAAAAAAA.77mAA',
        role: "admin",
      })
      .expect(201);
    jwtToken = response.body.data.access_token;
    expect(response.body.message).toEqual('REGISTER_SUCCEEDED');
  });
  it("Can't register using the same e-mail", async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: "seifadminUser@yopmail.com",
        password: 'AAAAAAAA.77mAA',
        role: "admin",
      })
      .expect(400);
    expect(response.body.message).toEqual('EMAIL_ALREADY_USED');
  });
  it("Can't register with invalid email or password format", async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: "seifadminUser@yopmailcom", // put invalid email 
        /// put invalid password such as a valid format [string, min 8 characters, one uppercase, one lowercase, one number, one special character]
        password: 'AAAAAAAA.sAA', 
        role: "admin",
      })
      .expect(400);
    expect(response.body.message)
  });
  it('Login', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: "seifUser@yopmail.com",
        password: 'AAAAAAAA.77mAA',
      })
      .expect(201);
    jwtToken = response.body.data.access_token;
    expect(response.body.message).toEqual('LOGIN_SUCCEEDED');
  });
  it("Can't login with wrong password", async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: "seifUser@yopmail.com",
        password: 'AAAA***AAAA.77mAA',
      })
      .expect(400);
    expect(response.body.message).toEqual('WRONG_PASSWORD');
  });
  it("Can't login with wrong email", async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: "seifUser--@yopmail.com",
        password: 'AAAAAAAA.77mAA',
      })
      .expect(400);
    expect(response.body.message).toEqual('INVALID_EMAIL');
  });




});
