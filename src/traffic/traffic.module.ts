// traffic.module.ts — Модуль трафика
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TrafficController } from './traffic.controller';
import { RoutingService } from './services/routing.service';
import { TransactionService } from './services/transaction.service';
import { Click } from './entities/click.entity';
import { Transaction } from './entities/transaction.entity';
import { MerchantModule } from '../merchant/merchant.module';
import { ProviderModule } from '../provider/provider.module';
import { RuleModule } from '../rule/rule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Click, Transaction]),
    BullModule.registerQueue(
      { name: 'postback' },
      { name: 'webhook' },
      { name: 'statistics' },
    ),
    MerchantModule,
    ProviderModule,
    RuleModule,
  ],
  controllers: [TrafficController],
  providers: [RoutingService, TransactionService],
  exports: [RoutingService, TransactionService],
})
export class TrafficModule {}
