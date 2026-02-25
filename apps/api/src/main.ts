import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { join } from 'path';
import { homedir } from 'os';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS')?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  const localStorageDir =
    process.env.LOCAL_STORAGE_DIR || join(homedir(), '.pribec', 'storage');
  const legacyStorageDir = join(process.cwd(), 'storage');
  app.use('/storage', (req: Request, res: Response, next: NextFunction) => {
    void req;
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });
  app.use('/storage', express.static(localStorageDir));
  app.use('/storage', express.static(legacyStorageDir));

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PRIBEC API')
    .setDescription('Real Estate & Construction Trust Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
