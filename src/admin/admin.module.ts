// admin.module.ts — Модуль администрирования
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Click } from '../traffic/entities/click.entity';
import { Transaction } from '../traffic/entities/transaction.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { Provider } from '../provider/entities/provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Click, Transaction, Merchant, Provider]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
