// main.ts — Bootstrap NestJS приложения
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { abortOnError: false });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);

  // Use PORT env var for Railway deployment
  const listenPort = Number(process.env.PORT) || port;

  // Fallback HTML for Railway
  const fallbackHtml = '<!DOCTYPE html><html><head><title>BrudaGate</title></head><body><h1>BrudaGate Admin</h1><p>Admin panel loading...</p></body></html>';

  // Serve static files
  try {
    app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/' });
  } catch {
    // Public dir not available, use fallback
  }

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    next();
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Health check endpoint for Railway
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // Root path serves index.html
  httpAdapter.get('/', (req, res) => {
    const indexPath = join(process.cwd(), 'public', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).set({'Content-Type': 'text/html'}).send(fallbackHtml);
      }
    });
  });

  await app.listen(listenPort, '0.0.0.0');
  Logger.log(`🚀 BrudaGate is running on port ${listenPort}`);
}

void bootstrap();
