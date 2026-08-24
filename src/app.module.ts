// app.module.ts — Root module
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { BullMQModule } from './bull/bull.module';
import { TrafficModule } from './traffic/traffic.module';
import { MerchantModule } from './merchant/merchant.module';
import { ProviderModule } from './provider/provider.module';
import { RuleModule } from './rule/rule.module';
import { ReportingModule } from './reporting/reporting.module';
import { WebhookModule } from './webhook/webhook.module';
import { PostbackModule } from './postback/postback.module';
import { AdminModule } from './admin/admin.module';
import configuration from './config/configuration';

// Helper to check if Redis is configured and not localhost
function isRedisAvailable(): boolean {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      return url.hostname !== '127.0.0.1' && url.hostname !== 'localhost';
    } catch {
      return false;
    }
  }

  if (redisHost) {
    return redisHost !== '127.0.0.1' && redisHost !== 'localhost';
  }

  return false;
}

// Helper to check if PostgreSQL is configured and not localhost
function isPostgresAvailable(): boolean {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      return url.hostname !== '127.0.0.1' && url.hostname !== 'localhost';
    } catch {
      return false;
    }
  }

  const dbHost = process.env.DB_HOST;
  if (dbHost) {
    return dbHost !== '127.0.0.1' && dbHost !== 'localhost';
  }

  return false;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // Only import TypeORM if PostgreSQL is available
    ...(isPostgresAvailable()
      ? [
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService): TypeOrmModuleOptions => {
              const databaseUrl = config.get<string>('DATABASE_URL');
              if (databaseUrl) {
                return {
                  type: 'postgres',
                  url: databaseUrl,
                  autoLoadEntities: true,
                  synchronize: true,
                  logging: ['error'],
                };
              }
              return {
                type: 'postgres',
                host: config.get('DB_HOST', 'localhost'),
                port: Number(config.get('DB_PORT', 5432)),
                username: config.get('DB_USER', 'brudagate'),
                password: config.get('DB_PASS', 'brudagate'),
                database: config.get('DB_NAME', 'brudagate'),
                autoLoadEntities: true,
                synchronize: true,
                logging: ['error'],
              };
            },
          }),
        ]
      : []),
    ...BullMQModule.register(),
    MerchantModule,
    ProviderModule,
    RuleModule,
    TrafficModule,
    WebhookModule,
    PostbackModule,
    AdminModule,
    ReportingModule,
  ],
})
export class AppModule {}
