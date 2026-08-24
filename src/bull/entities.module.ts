// entities.module.ts — Centralized entity imports
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../merchant/entities/merchant.entity';
import { Provider } from '../provider/entities/provider.entity';
import { Rule } from '../rule/entities/rule.entity';
import { Click } from '../traffic/entities/click.entity';
import { Transaction } from '../traffic/entities/transaction.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Merchant,
      Provider,
      Rule,
      Click,
      Transaction,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class EntitiesModule {}
