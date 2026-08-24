// reporting.module.ts — Модуль статистики
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { Transaction } from '../traffic/entities/transaction.entity';
import { Click } from '../traffic/entities/click.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Click])],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
