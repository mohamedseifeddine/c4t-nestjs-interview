import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule,JwtService } from '@nestjs/jwt';
import jwt_decode from "jwt-decode";
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';
import { UserService } from '../src/user/user.service';
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
  let userService: UserService;
  
  const id = '63528874632bc75ac5b59540';
  const user = new Types.ObjectId('6351d04551267afcf544afe2');
  let jwtUserToken, jwtAdminToken,AdminMovieId, UserMovieId, userId

  beforeAll(async () => {
    jest.setTimeout(10000000);
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
                  'C4T-APIs',
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
      .overrideGuard({JwtAuthGuard})
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.auth = { user: user };
          req.user = { user: user };
          return true;
        },

      })
      .compile();
      userService = moduleRef.get<UserService>(UserService);

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
        email: `SeifAsUserTest10@yopmail.com`,
        password: 'AAAAAAAA.77mAA',
        role: "user",
      })
      .expect(201);
    jwtUserToken = response.body.data.access_token;
    let decoded : any = jwt_decode(response.body.data.access_token);
    userId = decoded._id
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

  it('Login as admin', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: "SeifAsAdmin@yopmail.com",
        password: 'AAAAAAAA.77mAA',
      })
      .expect(201);
    jwtAdminToken = response.body.data.access_token;
    expect(response.body.message).toEqual('LOGIN_SUCCEEDED');
  });
  it('Login as user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'SeifAsUser214@yopmail.com',
        password: 'AAAAAAAA.77mAA',
      })
      .expect(201);
    jwtUserToken = response.body.data.access_token;
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

  it("Can retrieve the movie list when not logged in", async () => {
    const response = await request(app.getHttpServer())
      .get(`/movie`)
      .expect(200);
    expect(response.body.message).toEqual('MOVIES_FOUND');
  });

  it("Can retrieve the movie list when not logged in as admin", async () => {
    const response = await request(app.getHttpServer())
      .get(`/movie`)
      .set('Authorization', `Bearer ${jwtAdminToken}`)
      .expect(200);
    expect(response.body.message).toEqual('MOVIES_FOUND');
  });

  it("Can retrieve the movie list of a specific user when not logged in", async () => {
    const response = await request(app.getHttpServer())
      .get(`/movie/user/${userId}`)
      .expect(200);
    expect(response.body.message).toEqual('MOVIES_FOUND');
  });

  it("Can retrieve the movie list when not logged in as user", async () => {
    const response = await request(app.getHttpServer())
      .get(`/movie`)
      .set('Authorization', `Bearer ${jwtUserToken}`)
      .expect(200);
    expect(response.body.message).toEqual('MOVIES_FOUND');
  });

  it("Can't create a movie when not logged in", async () => {
    const response = await request(app.getHttpServer())
      .post(`/movie`)
      .send({
        title: "fourth movie",
        description: "A film – also called a movie, motion picture, moving picture, picture, photoplay or (slang) flick – is a work of visual art that simulates experiences and otherwise communicates ideas, stories, perceptions, feelings, beauty, or atmosphere through the use of moving images.",
        releaseDate: "2022-10-24T15:04:14.322",
        rating: 4,
        gender: "action",
        actors: [
          "Brad"
        ],
        poster: "https://www.linkedin.com/notifications/?filter=all"
      })
      .expect(401);
    expect(response.body.message).toEqual('Unauthorized');
  });
  it('Add movie as admin', async () => {
    const response = await request(app.getHttpServer())
      .post(`/movie`)
      .set('Authorization', `Bearer ${jwtAdminToken}`)
      .send({
        title: "fourth movie",
        description: "A film – also called a movie, motion picture, moving picture, picture, photoplay or (slang) flick – is a work of visual art that simulates experiences and otherwise communicates ideas, stories, perceptions, feelings, beauty, or atmosphere through the use of moving images.",
        releaseDate: "2022-10-24T15:04:14.322",
        rating: 4,
        gender: "action",
        actors: [
          "Brad"
        ],
        poster: "https://www.linkedin.com/notifications/?filter=all"
      })
      .expect(201);
      AdminMovieId = response.body.data._id
    expect(response.body.message).toEqual('MOVIE_CREATED');
  });
  it('Add movie as user', async () => {
    const response = await request(app.getHttpServer())
      .post(`/movie`)
      .set('Authorization', `Bearer ${jwtUserToken}`)
      .send({
        title: "fourth movie",
        description: "A film – also called a movie, motion picture, moving picture, picture, photoplay or (slang) flick – is a work of visual art that simulates experiences and otherwise communicates ideas, stories, perceptions, feelings, beauty, or atmosphere through the use of moving images.",
        releaseDate: "2022-10-24T15:04:14.322",
        rating: 4,
        gender: "action",
        actors: [
          "Brad"
        ],
        poster: "https://www.linkedin.com/notifications/?filter=all"
      })
      .expect(201);
      UserMovieId = response.body.data._id
    expect(response.body.message).toEqual('MOVIE_CREATED');
  });

  it('Movie should accept right format', async () => {
    const response = await request(app.getHttpServer())
      .post(`/movie`)
      .set('Authorization', `Bearer ${jwtUserToken}`)
      .send({
        title: "fourth movvie",
        description: "A film – also called a movie, motion picture, moving picture, picture, photoplay or (slang) flick – is a work of visual art that simulates experiences and otherwise communicates ideas, stories, perceptions, feelings, beauty, or atmosphere through the use of moving images.",
        releaseDate: "2022-10-24T15:04:14.322",
        rating: 44, // invalid rating range
        gender: "action",
        actors: [
          "Brad"
        ],
        poster: "https://www.linkedin.com/notifications/?filter=all"
      })
      .expect(400);
    expect(response.body.message)
  });

  it('User can update own movie', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/movie/update/${UserMovieId}`)
      .set('Authorization', `Bearer ${jwtUserToken}`)
      .send({
        title: "amazing movie",
      })
      .expect(200);
    expect(response.body.message).toEqual("MOVIE_UPDATED")
  });

  it('Updating a movie should pass the field validators', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/movie/update/${UserMovieId}`)
      .set('Authorization', `Bearer ${jwtUserToken}`)
      .send({
        title: "a",
      })
      .expect(400);
    expect(response.body.message).toEqual(["Title is too short"])
  });
  
  it("Can't update another user's movie when not admin", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/movie/update/${AdminMovieId}`)
      .set('Authorization', `Bearer ${jwtUserToken}`)
      .send({
        title: "amazing movie",
      })
      .expect(403);
    expect(response.body.message).toEqual("Forbidden resource")
  });

  it("Can update another user's movie when admin", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/movie/update/${UserMovieId}`)
      .set('Authorization', `Bearer ${jwtAdminToken}`)
      .send({
        title: "amazing movie",
      })
      .expect(200);
    expect(response.body.message).toEqual("MOVIE_UPDATED")
  });

  it("Can delete user's own movie", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/movie/delete/${UserMovieId}`)
      .set('Authorization', `Bearer ${jwtUserToken}`)
      .expect(200);
    expect(response.body.message).toEqual("MOVIE_DELETED")
  });

  it("Can't delete another user's movie when not admin", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/movie/delete/${AdminMovieId}`)
      .set('Authorization', `Bearer ${jwtUserToken}`)
      .expect(403);
    expect(response.body.message).toEqual("Forbidden resource")
  });

  it('Add movie as user', async () => {
    const response = await request(app.getHttpServer())
      .post(`/movie`)
      .set('Authorization', `Bearer ${jwtUserToken}`)
      .send({
        title: "fourth movie",
        description: "A film – also called a movie, motion picture, moving picture, picture, photoplay or (slang) flick – is a work of visual art that simulates experiences and otherwise communicates ideas, stories, perceptions, feelings, beauty, or atmosphere through the use of moving images.",
        releaseDate: "2022-10-24T15:04:14.322",
        rating: 4,
        gender: "action",
        actors: [
          "Brad"
        ],
        poster: "https://www.linkedin.com/notifications/?filter=all"
      })
      .expect(201);
      UserMovieId = response.body.data._id
  });

  it("Can delete another user's movie when admin", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/movie/delete/${UserMovieId}`)
      .set('Authorization', `Bearer ${jwtAdminToken}`)
      .expect(200);
    expect(response.body.message).toEqual("MOVIE_DELETED")
  });
});
