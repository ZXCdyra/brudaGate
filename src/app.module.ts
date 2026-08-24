// app.module.ts — Root module
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
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
    BullMQModule,
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
