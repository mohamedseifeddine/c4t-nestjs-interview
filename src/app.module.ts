import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './development.env',
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_HOST, {  
        useNewUrlParser: true,
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
            winston.format.align(),
            winston.format.colorize({ all: true }),
          ),
        }),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule {}






