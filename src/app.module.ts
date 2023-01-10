import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
// import { validateEnv } from './env.validation';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { JwtStrategy } from './guards/jwt.strategy';
import { MovieModule } from './movie/movie.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: './development.env',
    }),
    MongooseModule.forRoot(process.env.DATABASE_HOST, {
      useUnifiedTopology: true,
      minPoolSize: 20,
      maxPoolSize: 200,
    }),
    WinstonModule.forRoot({
      handleExceptions: true,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.ms(),
            winston.format.timestamp(),
            winston.format.json(),
            nestWinstonModuleUtilities.format.nestLike('c4t', {
              prettyPrint: true,
            }),
            winston.format.align(),
            winston.format.colorize({ all: true }),
          ),
        }),
      ],
    }),
    AuthModule,
    UserModule,
    MovieModule
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})

export class AppModule {};