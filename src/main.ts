import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable winston logger for nest js
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Enables validation pipes on all routes
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Enable swagger api documentation
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Auction_System_APIs')
    .setDescription('Auction-APIs-description')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('docs', app, document, {
    swaggerUrl: 'json',
  });
  await app.listen(3000);
}
bootstrap();
